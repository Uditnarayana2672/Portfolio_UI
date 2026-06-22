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
    }),
  })
}

// ── Wizard data → backend config ─────────────────────────────────────────────
// Editors store camelCase fields; backend expects snake_case with different names.
// Returns null for blocks that can't be sent (missing a truly required URL/id).
function toBackendConfig(typeId: string, raw: Record<string, unknown>): Record<string, unknown> | null {
  const d = raw ?? {}

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
