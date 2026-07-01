import { supabase } from '../lib/supabaseClient'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

// Wizard template IDs → backend template IDs
// Backend allows: narrative | gallery | case-study | minimal
const TEMPLATE_MAP: Record<string, string> = {
  narrative:   'narrative',
  technical:   'case-study',
  visual:      'gallery',
  minimal:     'minimal',
  interactive: 'narrative',
}

async function authHeader(): Promise<Record<string, string>> {
  if (import.meta.env.VITE_SKIP_AUTH === 'true') return {}
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const auth = await authHeader()
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...auth,
      ...(init?.headers as Record<string, string> | undefined),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const raw = body?.detail?.message ?? body?.message ?? body?.detail ?? `HTTP ${res.status}`
    throw new Error(typeof raw === 'string' ? raw : JSON.stringify(raw))
  }
  return res.json() as T
}

// ─────────────────────────────────────────────────────────────────────────────

export interface CreateProjectPayload {
  title: string
  slug: string
  excerpt: string
  template_id: string      // wizard TemplateId — mapped internally
  tech_stack: string[]
  github_url: string | null
  demo_url: string | null
  is_featured: boolean
  seo: {
    meta_title: string | null
    meta_description: string | null
    og_image_url: string | null
  }
  // Editorial header fields for the public detail page (optional, flat columns).
  category?: string | null
  role?: string | null
  project_timeline?: string | null
  display_status?: string | null
  recognition?: string | null
}

export interface CreateProjectResult {
  id: string
  slug: string
  status: string
}

export interface BlockInput {
  type_id: string
  data: Record<string, unknown>
}

export interface PublishResult {
  id: string
  slug: string
  status: string
  published_at: string | null
  url: string
}

export async function createDraftProject(
  payload: CreateProjectPayload,
): Promise<CreateProjectResult> {
  return apiFetch<CreateProjectResult>('/api/v1/admin/projects', {
    method: 'POST',
    body: JSON.stringify({
      title:       payload.title,
      slug:        payload.slug || undefined,
      excerpt:     payload.excerpt || undefined,
      template_id: TEMPLATE_MAP[payload.template_id] ?? 'narrative',
      tech_stack:  payload.tech_stack,
      github_url:  payload.github_url,
      demo_url:    payload.demo_url,
      status:      'draft',
      visibility:  'public',
      is_featured: payload.is_featured,
      seo: {
        meta_title:       payload.seo.meta_title,
        meta_description: payload.seo.meta_description,
        og_image_url:     payload.seo.og_image_url,
        canonical_url:    null,
      },
      category:         payload.category ?? null,
      role:             payload.role ?? null,
      project_timeline: payload.project_timeline ?? null,
      display_status:   payload.display_status ?? null,
      recognition:      payload.recognition ?? null,
    }),
  })
}

// Block types that carry an editorial section header (eyebrow/heading/subheading)
// on the public page. Mirrors the SectionHeaderMixin on the backend.
const SECTION_HEADER_TYPES = new Set([
  'text', 'image', 'gallery', 'video', 'code',
  'timeline', 'stats', 'poll', 'quote', 'comparison', 'embed',
])

function pickHeader(d: Record<string, unknown>): Record<string, unknown> {
  return {
    eyebrow:    (d.eyebrow as string)    || null,
    heading:    (d.heading as string)    || null,
    subheading: (d.subheading as string) || null,
  }
}

// ── Wizard data → backend config ─────────────────────────────────────────────
// Editors store camelCase fields; backend expects snake_case with different names.
// Returns null for blocks that can't be sent (missing a truly required URL/id).
function toBackendConfig(typeId: string, raw: Record<string, unknown>): Record<string, unknown> | null {
  const d = raw ?? {}
  const base = baseConfig(typeId, d)
  if (base === null) return null
  // Section blocks also carry the optional editorial header fields.
  return SECTION_HEADER_TYPES.has(typeId) ? { ...base, ...pickHeader(d) } : base
}

function baseConfig(typeId: string, d: Record<string, unknown>): Record<string, unknown> | null {
  switch (typeId) {
    case 'hero':
      return {
        // hero editor has no heading field — derive from caption or use a placeholder
        heading:              (d.caption as string)   || (d.altText as string) || 'Hero',
        background_image_url: (d.imageUrl as string)  || null,
        min_height:           d.height === 'full'     ? '100vh'
                            : d.height === 'compact'  ? '40vh' : '60vh',
        align:                'center',
      }

    case 'text':
      return {
        content:   (d.html as string) || '',
        max_width: 'default',
        style:     (d.style as string) || 'standard',
      }

    case 'image': {
      const url = d.imageUrl as string
      if (!url) return null
      return {
        image_url: url,
        alt_text:  (d.altText  as string) || null,
        caption:   (d.caption  as string) || null,
        width:     (d.size     as string) || 'medium',
        align:     (d.align    as string) || 'center',
      }
    }

    case 'gallery': {
      const images = Array.isArray(d.images) ? d.images : []
      return {
        images,
        layout:       (d.layout as string) || 'grid',
        columns:      3,
        gap:          'md',
        show_captions: true,
      }
    }

    case 'video': {
      const url = (d.embedUrl as string) || ''
      if (!url) return null
      return {
        video_url: url,
        caption:   (d.caption as string) || null,
        controls:  true,
        width:     'full',
      }
    }

    case 'code':
      return {
        code:              (d.code     as string) || '',
        language:          (d.language as string) || 'plaintext',
        filename:          (d.filename as string) || null,
        show_line_numbers: true,
        highlight_lines:   [],
        theme:             'dark',
      }

    case 'timeline': {
      const entries = Array.isArray(d.entries) ? d.entries : []
      return {
        items: (entries as Array<Record<string, unknown>>).map(e => ({
          date:        (e.date        as string) || '',
          title:       (e.title       as string) || '',
          description: (e.description as string) || null,
        })),
        direction:       'vertical',
        show_connectors:  true,
      }
    }

    case 'stats': {
      const metrics = Array.isArray(d.metrics) ? d.metrics : []
      return {
        metrics: (metrics as Array<Record<string, unknown>>)
          .filter(m => m.value || m.label)
          .map(m => ({ value: (m.value as string) || '', label: (m.label as string) || '' })),
        columns: 3,
        style:   'card',
      }
    }

    case 'poll': {
      const question = (d.question as string) || ''
      const options  = Array.isArray(d.options) ? d.options as string[] : []
      if (!question || options.length < 2) return null
      return {
        question,
        options,
        anonymous:    true,
        show_results: true,
        expiry_date:  (d.expiry as string) || null,
      }
    }

    case 'quote': {
      const text = (d.text as string) || ''
      if (!text) return null
      return {
        text,
        attribution_name: (d.name as string) || null,
        attribution_role: (d.role as string) || null,
        style:            (d.style as string) || 'pullquote',
      }
    }

    case 'comparison':
      return {
        left_label:    (d.leftLabel   as string) || 'Before',
        left_content:  (d.leftContent as string) || '',
        right_label:   (d.rightLabel  as string) || 'After',
        right_content: (d.rightContent as string) || '',
        style:         'split',
      }

    case 'cta':
      return {
        // cta editor uses `label` for the button text — map to `heading` (required)
        heading:       (d.label    as string) || 'Get in touch',
        description:   (d.subtext  as string) || null,
        primary_label: (d.label    as string) || null,
        primary_url:   (d.url      as string) || null,
        align:         (d.align    as string) || 'center',
        style:         (d.style    as string) || 'filled',
      }

    case 'form': {
      const formId = (d.formId as string) || ''
      if (!formId) return null
      return {
        form_id:    formId,
        form_name:  (d.formName as string) || null,
        embed_type: 'typeform',
        height:     480,
      }
    }

    case 'embed': {
      const url = (d.embedUrl as string) || ''
      if (!url) return null
      return {
        embed_url:        url,
        provider:         (d.provider as string)    || null,
        source_label:     (d.sourceLabel as string) || null,
        caption:          (d.caption as string)     || null,
        height:           typeof d.height === 'number' ? d.height : 480,
        allow_fullscreen: d.allowFullscreen !== false,
      }
    }

    default:
      return d
  }
}

export async function addProjectBlock(
  projectId: string,
  block: BlockInput,
  position: number,
): Promise<void> {
  const config = toBackendConfig(block.type_id, block.data ?? {})
  if (config === null) return   // block has required fields not filled in — skip silently

  await apiFetch(`/api/v1/admin/projects/${projectId}/blocks`, {
    method: 'POST',
    body: JSON.stringify({
      block_type: block.type_id,
      position,
      config,
    }),
  })
}

export async function publishProject(projectId: string): Promise<PublishResult> {
  return apiFetch<PublishResult>(`/api/v1/admin/projects/${projectId}/publish`, {
    method: 'POST',
  })
}

// ── Project Manager API ───────────────────────────────────────────────────────

export interface ProjectSummary {
  id: string
  title: string
  slug: string
  excerpt: string | null
  thumbnail_url: string | null
  template_id: string
  status: 'draft' | 'published' | 'archived'
  is_featured: boolean
  views: number
  reactions_count: number
  tech_stack: string[]
  github_url: string | null
  demo_url: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface ListProjectsParams {
  status_filter?: string
  search?: string
  page?: number
  page_size?: number
  template_id?: string
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
}

export interface ListProjectsResult {
  items: ProjectSummary[]
  total: number
  page: number
  page_size: number
}

export async function listProjects(params: ListProjectsParams = {}): Promise<ListProjectsResult> {
  const qs = new URLSearchParams()
  if (params.status_filter) qs.set('status_filter', params.status_filter)
  if (params.search) qs.set('search', params.search)
  if (params.page) qs.set('page', String(params.page))
  if (params.page_size) qs.set('page_size', String(params.page_size))
  if (params.template_id) qs.set('template_id', params.template_id)
  if (params.sort_by) qs.set('sort_by', params.sort_by)
  if (params.sort_dir) qs.set('sort_dir', params.sort_dir)
  const query = qs.toString()
  return apiFetch<ListProjectsResult>(`/api/v1/admin/projects${query ? `?${query}` : ''}`)
}

export interface StatusCounts {
  total: number
  draft: number
  published: number
  archived: number
}

export async function getStatusCounts(): Promise<StatusCounts> {
  return apiFetch<StatusCounts>('/api/v1/admin/projects/status-counts')
}

export type BulkAction = 'publish' | 'archive' | 'feature' | 'unfeature' | 'delete'

export interface BulkActionResult {
  action: string
  requested: number
  succeeded: number
  failed: number
  skipped: number
  project_ids: string[]
}

export async function bulkAction(action: BulkAction, projectIds: string[]): Promise<BulkActionResult> {
  return apiFetch<BulkActionResult>('/api/v1/admin/projects/bulk', {
    method: 'POST',
    body: JSON.stringify({ action, project_ids: projectIds }),
  })
}

export async function archiveProject(projectId: string): Promise<void> {
  await apiFetch(`/api/v1/admin/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'archived' }),
  })
}

export async function deleteProject(projectId: string): Promise<void> {
  const auth = await authHeader()
  const res = await fetch(`${API_BASE}/api/v1/admin/projects/${projectId}`, {
    method: 'DELETE',
    headers: auth,
  })
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}))
    const raw = body?.detail?.message ?? body?.message ?? body?.detail ?? `HTTP ${res.status}`
    throw new Error(typeof raw === 'string' ? raw : JSON.stringify(raw))
  }
}

export async function duplicateProject(projectId: string): Promise<{ id: string; slug: string }> {
  const result = await apiFetch<{ original_id: string; new_project: { id: string; slug: string } }>(
    `/api/v1/admin/projects/${projectId}/duplicate`,
    { method: 'POST', body: JSON.stringify({}) },
  )
  return result.new_project
}

export async function toggleFeature(projectId: string, isFeatured: boolean): Promise<void> {
  await apiFetch(`/api/v1/admin/projects/${projectId}/feature`, {
    method: 'PATCH',
    body: JSON.stringify({ is_featured: isFeatured }),
  })
}

// ── Single project (edit page) ────────────────────────────────────────────────

export interface ProjectSeo {
  meta_title: string | null
  meta_description: string | null
  og_image_url: string | null
  canonical_url: string | null
}

export interface ProjectDetail {
  id: string
  title: string
  slug: string
  excerpt: string | null
  thumbnail_url: string | null
  tech_stack: string[]
  template_id: string
  github_url: string | null
  demo_url: string | null
  status: string
  visibility: string
  is_featured: boolean
  views: number
  seo: ProjectSeo
  meta: Record<string, unknown>
  // Editorial project-header fields (backend returns these top-level; may also
  // arrive via `meta` from the wizard). All optional.
  category?: string | null
  role?: string | null
  project_timeline?: string | null
  display_status?: string | null
  recognition?: string | null
  blocks: Array<{ id: string; block_type: string; position: number; config: Record<string, unknown> }>
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface UpdateProjectPayload {
  title?: string
  slug?: string
  excerpt?: string | null
  thumbnail_url?: string | null
  tech_stack?: string[]
  template_id?: string
  github_url?: string | null
  demo_url?: string | null
  status?: string
  visibility?: string
  is_featured?: boolean
  seo?: Partial<ProjectSeo>
  category?: string | null
  role?: string | null
  project_timeline?: string | null
  display_status?: string | null
  recognition?: string | null
}

export async function getProject(projectId: string): Promise<ProjectDetail> {
  return apiFetch<ProjectDetail>(`/api/v1/admin/projects/${projectId}`)
}

export async function updateProject(
  projectId: string,
  payload: UpdateProjectPayload,
): Promise<ProjectDetail> {
  return apiFetch<ProjectDetail>(`/api/v1/admin/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

// ── Block mutations (edit page) ───────────────────────────────────────────────

export async function updateBlock(
  projectId: string,
  blockId: string,
  typeId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const config = toBackendConfig(typeId, data)
  if (config === null) return
  await apiFetch(`/api/v1/admin/projects/${projectId}/blocks/${blockId}`, {
    method: 'PUT',
    body: JSON.stringify({ config }),
  })
}

export async function deleteBlock(projectId: string, blockId: string): Promise<void> {
  const auth = await authHeader()
  const res = await fetch(`${API_BASE}/api/v1/admin/projects/${projectId}/blocks/${blockId}`, {
    method: 'DELETE',
    headers: auth,
  })
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}))
    const raw = body?.detail?.message ?? body?.message ?? body?.detail ?? `HTTP ${res.status}`
    throw new Error(typeof raw === 'string' ? raw : JSON.stringify(raw))
  }
}

export async function reorderProjectBlocks(
  projectId: string,
  blockIds: string[],
): Promise<void> {
  await apiFetch(`/api/v1/admin/projects/${projectId}/blocks/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ block_ids: blockIds }),
  })
}

// Converts a stored backend block config back into the camelCase editor data shape.
export function fromBackendConfig(typeId: string, config: Record<string, unknown>): Record<string, unknown> {
  const c = config ?? {}
  const base = baseFromBackend(typeId, c)
  if (SECTION_HEADER_TYPES.has(typeId)) {
    return {
      ...base,
      eyebrow:    (c.eyebrow as string)    ?? '',
      heading:    (c.heading as string)    ?? '',
      subheading: (c.subheading as string) ?? '',
    }
  }
  return base
}

function baseFromBackend(typeId: string, c: Record<string, unknown>): Record<string, unknown> {
  switch (typeId) {
    case 'hero': {
      const h = c.min_height as string
      return {
        imageUrl:    (c.background_image_url as string) ?? '',
        altText:     '',
        height:      h === '100vh' ? 'full' : h === '40vh' ? 'compact' : 'standard',
        showCaption: false,
        caption:     '',
      }
    }
    case 'text':
      return { html: (c.content as string) ?? '', style: (c.style as string) ?? 'standard' }
    case 'image':
      return {
        imageUrl: (c.image_url as string) ?? '',
        altText:  (c.alt_text as string) ?? '',
        caption:  (c.caption as string) ?? '',
        size:     (c.width as string) ?? 'full',
        align:    (c.align as string) ?? 'center',
      }
    case 'gallery':
      return {
        images: (c.images as unknown[]) ?? [],
        layout: (c.layout as string) ?? 'grid',
      }
    case 'video':
      return {
        tab:      'embed',
        embedUrl: (c.video_url as string) ?? '',
        caption:  (c.caption as string) ?? '',
        autoplay: false,
      }
    case 'code':
      return {
        code:     (c.code as string) ?? '',
        language: (c.language as string) ?? 'javascript',
        filename: (c.filename as string) ?? '',
      }
    case 'timeline':
      return {
        entries: (c.items as Record<string, unknown>[]) ?? [{ date: '', title: '', description: '' }],
      }
    case 'stats':
      return {
        metrics: (c.metrics as Record<string, unknown>[]) ?? [{ value: '', label: '' }],
      }
    case 'poll':
      return {
        question:    (c.question as string) ?? '',
        options:     (c.options as string[]) ?? ['', ''],
        anonymous:   (c.anonymous as boolean) ?? false,
        showResults: (c.show_results as boolean) ?? true,
        expiry:      (c.expiry_date as string) ?? '',
      }
    case 'quote':
      return {
        text:  (c.text as string) ?? '',
        name:  (c.attribution_name as string) ?? '',
        role:  (c.attribution_role as string) ?? '',
        style: (c.style as string) ?? 'blockquote',
      }
    case 'comparison':
      return {
        leftLabel:    (c.left_label as string) ?? 'Before',
        leftContent:  (c.left_content as string) ?? '',
        rightLabel:   (c.right_label as string) ?? 'After',
        rightContent: (c.right_content as string) ?? '',
      }
    case 'cta':
      return {
        label:   (c.primary_label as string) ?? (c.heading as string) ?? '',
        url:     (c.primary_url as string) ?? '',
        style:   (c.style as string) ?? 'primary',
        align:   (c.align as string) ?? 'center',
        subtext: (c.description as string) ?? '',
      }
    case 'form':
      return {
        formId:   (c.form_id as string) ?? '',
        formName: (c.form_name as string) ?? '',
      }
    case 'embed':
      return {
        embedUrl:        (c.embed_url as string) ?? '',
        provider:        (c.provider as string) ?? '',
        sourceLabel:     (c.source_label as string) ?? '',
        caption:         (c.caption as string) ?? '',
        height:          typeof c.height === 'number' ? c.height : 480,
        allowFullscreen: (c.allow_fullscreen as boolean) ?? true,
      }
    default:
      return c
  }
}
