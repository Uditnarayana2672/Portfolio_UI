// Blog Manager filter state ("Blog Manager API.md" §6). Lives in the URL so
// refresh, back from the editor and shared links keep the same view.

import type { BlogStatus, ListSort, PostListItem, PostListParams } from '../types/blog'

export const STATUS_PILLS: { value: BlogStatus; label: string; dot: string }[] = [
  { value: 'published', label: 'Published', dot: 'ok' },
  { value: 'draft', label: 'Draft', dot: 'draft' },
  { value: 'scheduled', label: 'Scheduled', dot: 'scheduled' },
  { value: 'archived', label: 'Archived', dot: 'archived' },
]

export const SORT_OPTIONS: { value: ListSort; label: string }[] = [
  { value: 'updated_at', label: 'Last edited' },
  { value: 'published_at', label: 'Published date' },
  { value: 'created_at', label: 'Created' },
  { value: 'title', label: 'Title' },
  { value: 'views', label: 'Views' },
]

const STATUS_VALUES = new Set<string>(STATUS_PILLS.map((p) => p.value))
const SORT_VALUES = new Set<string>([...SORT_OPTIONS.map((s) => s.value), 'relevance'])

export function readParams(search: URLSearchParams): PostListParams {
  const status = search.getAll('status').flatMap((s) => s.split(','))
    .filter((s, i, all) => STATUS_VALUES.has(s) && all.indexOf(s) === i) as BlogStatus[]
  const sort = search.get('sort')
  const dir = search.get('dir')
  return {
    status,
    category: search.get('category') || null,
    q: search.get('q') ?? '',
    sort: sort && SORT_VALUES.has(sort) ? (sort as ListSort) : null,
    dir: dir === 'asc' || dir === 'desc' ? dir : null,
    page: Math.max(1, Number(search.get('page')) || 1),
  }
}

export function writeParams(p: PostListParams): URLSearchParams {
  const out = new URLSearchParams()
  p.status.forEach((s) => out.append('status', s))
  if (p.category) out.set('category', p.category)
  if (p.q) out.set('q', p.q)
  if (p.sort) out.set('sort', p.sort)
  if (p.dir) out.set('dir', p.dir)
  if (p.page > 1) out.set('page', String(p.page))
  return out
}

/** Status pills are multi-select; [] means All. Deselecting the last one
 *  returns to All. */
export function toggleStatus(current: BlogStatus[], value: BlogStatus): BlogStatus[] {
  return current.includes(value) ? current.filter((s) => s !== value) : [...current, value]
}

/** Mirrors the server's delete rule (API §4.3), so the confirm dialog can
 *  warn before anything is sent. */
export function canDelete(post: Pick<PostListItem, 'status' | 'published_at'>): boolean {
  if (post.status === 'archived') return true
  return post.status === 'draft' && post.published_at === null
}
