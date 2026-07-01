// Public, unauthenticated API for the project detail page.
// No Supabase session required — these endpoints only return published work.
import type { PublicProject, ReactionCounts, ReactionType } from '../types/publicProject'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

async function publicFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const raw =
      body?.detail?.message ?? body?.message ?? body?.detail ?? `HTTP ${res.status}`
    const err = new Error(typeof raw === 'string' ? raw : JSON.stringify(raw)) as Error & {
      status?: number
    }
    err.status = res.status
    throw err
  }
  return res.json() as Promise<T>
}

export function getPublicProject(slug: string): Promise<PublicProject> {
  return publicFetch<PublicProject>(`/api/v1/projects/${encodeURIComponent(slug)}`)
}

// A stable per-browser id so a reaction can be loosely attributed without auth.
function sessionId(): string {
  const KEY = 'pf-visitor-id'
  try {
    let v = localStorage.getItem(KEY)
    if (!v) {
      v = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`)
      localStorage.setItem(KEY, v)
    }
    return v
  } catch {
    return 'anon'
  }
}

export async function reactToProject(
  slug: string,
  reaction: ReactionType,
): Promise<ReactionCounts> {
  const res = await publicFetch<{ slug: string; reactions: ReactionCounts }>(
    `/api/v1/projects/${encodeURIComponent(slug)}/reactions`,
    {
      method: 'POST',
      body: JSON.stringify({ reaction_type: reaction, session_id: sessionId() }),
    },
  )
  return res.reactions
}
