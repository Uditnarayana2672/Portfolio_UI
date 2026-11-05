import { supabase } from '../lib/supabaseClient'
import type {
  BlogCategory,
  BlogStats,
  BulkAction,
  BulkResult,
  Checklist,
  EditorConfig,
  LinkTarget,
  PostDetail,
  PostListParams,
  PostListResponse,
  PostWritable,
  PreviewPayload,
  ResolvedEmbed,
  RevisionDetail,
  RevisionSummary,
  SaveResult,
  SlugCheck,
} from '../types/blog'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

/** Error carrying the API's `{detail: {error, message, detail}}` envelope. */
export class BlogApiError extends Error {
  status: number
  code: string
  detail: Record<string, unknown>

  constructor(status: number, code: string, message: string, detail: Record<string, unknown> = {}) {
    super(message)
    this.status = status
    this.code = code
    this.detail = detail
  }
}

async function authHeader(): Promise<Record<string, string>> {
  if (import.meta.env.DEV && import.meta.env.VITE_SKIP_AUTH === 'true') return {}
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function request<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/v1${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(await authHeader()),
        ...(init.headers as Record<string, string> | undefined),
      },
    })
  } catch {
    throw new BlogApiError(0, 'NETWORK', 'Network unavailable')
  }

  // Expired token: refresh once and retry, so a long writing session never
  // loses a save to a stale JWT.
  if (res.status === 401 && !retried && !(import.meta.env.DEV && import.meta.env.VITE_SKIP_AUTH === 'true')) {
    const { error } = await supabase.auth.refreshSession()
    if (!error) return request<T>(path, init, true)
  }

  if (res.status === 204) return undefined as T
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const d = body?.detail
    if (d && typeof d === 'object' && !Array.isArray(d)) {
      throw new BlogApiError(res.status, d.error ?? `HTTP_${res.status}`, d.message ?? `HTTP ${res.status}`, d.detail ?? {})
    }
    const message = Array.isArray(d) ? d.map((e: { msg?: string }) => e.msg).join('; ') : (d ?? `HTTP ${res.status}`)
    throw new BlogApiError(res.status, `HTTP_${res.status}`, String(message))
  }
  return body as T
}

const json = (method: string, body: unknown, headers?: Record<string, string>): RequestInit => ({
  method,
  body: JSON.stringify(body),
  headers,
})

// ── editor setup ─────────────────────────────────────────────────────────────

export const getEditorConfig = () => request<EditorConfig>('/admin/blogs/editor-config')

// ── posts ────────────────────────────────────────────────────────────────────

export const createPost = (fields: Partial<PostWritable>, idempotencyKey: string) =>
  request<PostDetail>('/admin/blogs', json('POST', fields, { 'Idempotency-Key': idempotencyKey }))

export const getPost = (id: string) => request<PostDetail>(`/admin/blogs/${id}`)

export const updatePost = (id: string, version: number, fields: Partial<PostWritable>) =>
  request<SaveResult>(`/admin/blogs/${id}`, json('PATCH', { version, ...fields }))

/** Fire-and-forget save that survives the tab closing (keepalive fetch). */
export async function updatePostKeepalive(id: string, version: number, fields: Partial<PostWritable>) {
  try {
    await fetch(`${API_BASE}/api/v1/admin/blogs/${id}`, {
      method: 'PATCH',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({ version, ...fields }),
    })
  } catch {
    // Best effort; localStorage still holds the draft.
  }
}

export const deletePost = (id: string, version: number) =>
  request<void>(`/admin/blogs/${id}?version=${version}`, { method: 'DELETE' })

export const checkSlug = (slug: string, excludeId?: string | null) => {
  const qs = new URLSearchParams({ slug })
  if (excludeId) qs.set('exclude_id', excludeId)
  return request<SlugCheck>(`/admin/blogs/slug-check?${qs}`)
}

// ── publishing ───────────────────────────────────────────────────────────────

export const getChecklist = (id: string) => request<Checklist>(`/admin/blogs/${id}/checklist`)

export const publishPost = (id: string, version: number) =>
  request<PostDetail>(`/admin/blogs/${id}/publish`, json('POST', { version }))

export const schedulePost = (id: string, version: number, scheduledAt: string) =>
  request<PostDetail>(`/admin/blogs/${id}/schedule`, json('PUT', { version, scheduled_at: scheduledAt }))

export const unschedulePost = (id: string, version: number) =>
  request<PostDetail>(`/admin/blogs/${id}/schedule?version=${version}`, { method: 'DELETE' })

export const unpublishPost = (id: string, version: number) =>
  request<PostDetail>(`/admin/blogs/${id}/unpublish`, json('POST', { version }))

export const discardChanges = (id: string, version: number) =>
  request<PostDetail>(`/admin/blogs/${id}/discard-changes`, json('POST', { version }))

// ── preview ──────────────────────────────────────────────────────────────────

export const getPreview = (id: string, source: 'working' | 'live' = 'working') =>
  request<PreviewPayload>(`/admin/blogs/${id}/preview?source=${source}`)

// ── revisions ────────────────────────────────────────────────────────────────

export const saveRevision = (id: string, version: number, label?: string) =>
  request<RevisionSummary>(`/admin/blogs/${id}/revisions`, json('POST', { version, label }))

export const listRevisions = (id: string, page = 1) =>
  request<{ items: RevisionSummary[]; total: number; page: number; limit: number; total_pages: number }>(
    `/admin/blogs/${id}/revisions?page=${page}&limit=30`,
  )

export const getRevision = (id: string, revisionId: string) =>
  request<RevisionDetail>(`/admin/blogs/${id}/revisions/${revisionId}`)

export const restoreRevision = (id: string, revisionId: string, version: number) =>
  request<PostDetail>(`/admin/blogs/${id}/revisions/${revisionId}/restore`, json('POST', { version }))

// ── taxonomy ─────────────────────────────────────────────────────────────────

export const listCategories = () => request<{ items: BlogCategory[] }>('/admin/blog-categories')

export const createCategory = (name: string) =>
  request<BlogCategory>('/admin/blog-categories', json('POST', { name }))

export const listTags = (q: string) =>
  request<{ items: { tag: string; count: number }[] }>(`/admin/blog-tags?q=${encodeURIComponent(q)}&limit=8`)

// ── content helpers ──────────────────────────────────────────────────────────

export const resolveEmbed = (url: string) =>
  request<ResolvedEmbed>('/admin/blogs/embeds/resolve', json('POST', { url }))

export const searchLinkTargets = (q: string) =>
  request<{ items: LinkTarget[] }>(`/admin/blogs/link-targets?q=${encodeURIComponent(q)}&limit=8`)

// ── Blog Manager ─────────────────────────────────────────────────────────────

export const LIST_PAGE_SIZE = 20

export function listPosts(params: PostListParams, signal?: AbortSignal) {
  const qs = new URLSearchParams()
  params.status.forEach((s) => qs.append('status', s))
  if (params.category) qs.set('category_id', params.category)
  if (params.q.trim().length >= 2) qs.set('q', params.q.trim())
  if (params.sort) qs.set('sort', params.sort)
  if (params.dir) qs.set('dir', params.dir)
  qs.set('page', String(params.page))
  qs.set('limit', String(LIST_PAGE_SIZE))
  return request<PostListResponse>(`/admin/blogs?${qs}`, { signal })
}

export const getBlogStats = () => request<BlogStats>('/admin/blogs/stats')

export const bulkPosts = (action: BulkAction, items: { id: string; version: number }[]) =>
  request<BulkResult>('/admin/blogs/bulk', json('POST', { action, items }))

export const unarchivePost = (id: string, version: number) =>
  request<PostDetail>(`/admin/blogs/${id}/unarchive`, json('POST', { version }))
