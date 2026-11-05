// Calls to the backend, used at build time and from interactive page parts.
import type {
  BlogCard, BlogPost, PollResult, PortfolioDocument, ProjectCard, ProjectDetail, PublicComment,
} from './types'

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {}
export const API_BASE = `${(env.PUBLIC_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '')}/api/v1`
export const TURNSTILE_SITE_KEY = env.PUBLIC_TURNSTILE_SITE_KEY ?? ''

export class ApiError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
  } catch {
    throw new ApiError(0, 'NETWORK', 'We could not reach the server. Please try again in a minute.')
  }
  if (res.status === 204) return undefined as T
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const d = body?.detail
    if (d && typeof d === 'object' && !Array.isArray(d)) {
      throw new ApiError(res.status, d.error ?? `HTTP_${res.status}`, d.message ?? 'Something went wrong.')
    }
    const message = Array.isArray(d) ? 'Please check the highlighted details.' : (d ?? 'Something went wrong.')
    throw new ApiError(res.status, `HTTP_${res.status}`, String(message))
  }
  return body as T
}

const post = <T>(path: string, data: unknown) => call<T>(path, { method: 'POST', body: JSON.stringify(data) })

// A random per-browser id. It lets one person vote once without any account.
export function sessionId(): string {
  const key = 'lh-session'
  try {
    let id = localStorage.getItem(key)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(key, id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}

export const api = {
  portfolio: () => call<{ updated_at: string; content: PortfolioDocument }>('/portfolio-content'),
  projects: (query = '') =>
    call<{ items: ProjectCard[]; total: number; categories: { name: string; count: number }[] }>(`/projects${query}`),
  projectSlugs: () => call<{ items: string[] }>('/project-slugs'),
  project: (slug: string) => call<ProjectDetail>(`/projects/${encodeURIComponent(slug)}`),
  relatedBlogs: (slug: string, limit = 3) =>
    call<{ items: BlogCard[] }>(`/projects/${encodeURIComponent(slug)}/related-blogs?limit=${limit}`),
  projectEngagement: (slug: string) =>
    call<{ views: number; reactions: Record<string, number> }>(`/projects/${encodeURIComponent(slug)}/engagement`),
  projectView: (slug: string) => post<void>(`/projects/${encodeURIComponent(slug)}/views`, { session_id: sessionId() }),
  projectReact: (slug: string, reaction: string) =>
    post<{ reactions: Record<string, number> }>(`/projects/${encodeURIComponent(slug)}/reactions`, {
      reaction_type: reaction, session_id: sessionId(),
    }),
  poll: (blockId: string) => call<PollResult>(`/project-blocks/${blockId}/poll?session_id=${sessionId()}`),
  vote: (blockId: string, option: number) =>
    post<PollResult>(`/project-blocks/${blockId}/poll/votes`, { option_index: option, session_id: sessionId() }),
  contact: (data: Record<string, unknown>) => post<{ status: string }>('/contact-messages', data),
  blogs: (query = '') => call<{ items: BlogCard[]; total: number }>(`/blogs${query}`),
  blog: (slug: string) => call<BlogPost>(`/blogs/${encodeURIComponent(slug)}`),
  blogRelated: (slug: string, limit = 3) =>
    call<{ items: BlogCard[] }>(`/blogs/${encodeURIComponent(slug)}/related?limit=${limit}`),
  blogCategories: () =>
    call<{ items: { name: string; slug: string; description: string | null; post_count: number }[] }>('/blog-categories'),
  blogTags: () => call<{ items: { tag: string; count: number }[] }>('/blog-tags'),
  blogRedirects: () => call<{ items: { from: string; to: string }[] }>('/blog-redirects'),
  blogEngagement: (slug: string) =>
    call<{ views: number; comment_count: number; reactions: Record<string, number> }>(
      `/blogs/${encodeURIComponent(slug)}/engagement`,
    ),
  blogView: (slug: string) => post<void>(`/blogs/${encodeURIComponent(slug)}/views`, { session_id: sessionId() }),
  blogReact: (slug: string, reaction: string) =>
    post<{ reactions: Record<string, number> }>(`/blogs/${encodeURIComponent(slug)}/reactions`, {
      reaction_type: reaction, session_id: sessionId(),
    }),
  comments: (slug: string) =>
    call<{ items: PublicComment[]; total: number }>(`/blogs/${encodeURIComponent(slug)}/comments`),
  addComment: (slug: string, data: Record<string, unknown>) =>
    post<{ status: string }>(`/blogs/${encodeURIComponent(slug)}/comments`, data),
  subscribe: (data: Record<string, unknown>) => post<{ status: string }>('/newsletter/subscriptions', data),
  confirm: (token: string) => post<{ status: string }>('/newsletter/confirmations', { token }),
  unsubscribe: (token: string) => post<{ status: string }>('/newsletter/unsubscriptions', { token }),
}
