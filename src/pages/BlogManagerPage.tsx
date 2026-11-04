import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Pagination from '../components/ui/Pagination'
import {
  BlogApiError,
  LIST_PAGE_SIZE,
  bulkPosts,
  getBlogStats,
  listCategories,
  listPosts,
  unarchivePost,
} from '../api/blogApi'
import {
  SORT_OPTIONS,
  STATUS_PILLS,
  canDelete,
  readParams,
  toggleStatus,
  writeParams,
} from '../lib/blogManagerFilters'
import type {
  BlogCategory,
  BlogStats,
  BulkAction,
  BulkResult,
  ListSort,
  PostListItem,
  PostListParams,
  PostListResponse,
} from '../types/blog'
import s from './BlogManagerPage.module.css'

// Blog Manager — list, filter, search, archive/delete. Publishing and
// scheduling happen only inside the editor ("Blog Manager API.md").

const TZ = 'Asia/Kolkata'
const SEARCH_DEBOUNCE_MS = 250
const SCROLL_KEY = 'blog-manager-scroll:'

// ── formatting ───────────────────────────────────────────────────────────────

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  if (d === 1) return 'yesterday'
  if (d < 30) return `${d}d ago`
  if (d < 365) return `${Math.floor(d / 30)}mo ago`
  return `${Math.floor(d / 365)}y ago`
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: TZ, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }).replace(',', ' ·')
}

function fmtWhen(iso: string): string {
  const date = new Date(iso)
  const dayKey = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: TZ })
  const time = date.toLocaleTimeString('en-US', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false })
  const today = new Date()
  const tomorrow = new Date(today.getTime() + 86_400_000)
  if (dayKey(date) === dayKey(today)) return `today ${time}`
  if (dayKey(date) === dayKey(tomorrow)) return `tomorrow ${time}`
  return `${date.toLocaleDateString('en-US', { timeZone: TZ, weekday: 'short', month: 'short', day: 'numeric' })} ${time}`
}

function fmtCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n)
}

function errorText(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function BlogManagerPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(() => readParams(searchParams), [searchParams])

  const [data, setData] = useState<PostListResponse | null>(null)
  const [stats, setStats] = useState<BlogStats | null>(null)
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchText, setSearchText] = useState(params.q)
  const [selected, setSelected] = useState<Map<string, PostListItem>>(new Map())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const scrollRestored = useRef(false)

  function showToast(msg: string) {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }

  // Any filter change (not a page change) resets the page and the selection.
  const update = useCallback((patch: Partial<PostListParams>, keepSelection = false) => {
    const next = { ...readParams(searchParams), page: 1, ...patch }
    setSearchParams(writeParams(next), { replace: 'q' in patch })
    if (!keepSelection) setSelected(new Map())
  }, [searchParams, setSearchParams])

  // ── data ──────────────────────────────────────────────────────────────────

  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])
  // Loading = the last finished request isn't the one the URL asks for now.
  const requestKey = `${searchParams.toString()}#${reloadKey}`
  const [doneKey, setDoneKey] = useState<string | null>(null)
  const loading = doneKey !== requestKey

  useEffect(() => {
    const ctrl = new AbortController()
    listPosts(params, ctrl.signal)
      .then((res) => {
        setData(res)
        setError(null)
        // Past the last page (e.g. after deleting its only rows) → last page.
        if (res.items.length === 0 && res.total > 0 && params.page > res.total_pages) {
          update({ page: res.total_pages }, true)
        }
      })
      .catch((e) => { if (!ctrl.signal.aborted) setError(errorText(e, 'Could not load posts.')) })
      .finally(() => { if (!ctrl.signal.aborted) setDoneKey(requestKey) })
    return () => ctrl.abort()
    // `update` and `requestKey` change with searchParams, which `params` tracks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, reloadKey])

  const loadStats = useCallback(() => {
    getBlogStats().then(setStats).catch(() => { /* cards just stay empty */ })
  }, [])

  useEffect(() => {
    loadStats()
    listCategories().then((r) => setCategories(r.items)).catch(() => {})
  }, [loadStats])

  // Refetch when the tab regains focus (the scheduler may have published).
  useEffect(() => {
    const onFocus = () => { reload(); loadStats() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [reload, loadStats])

  // While a scheduled post is due within the hour, poll every minute.
  useEffect(() => {
    const next = stats?.next_scheduled_at ? new Date(stats.next_scheduled_at).getTime() : null
    if (!next || next - Date.now() > 3_600_000) return
    const t = setInterval(() => { reload(); loadStats() }, 60_000)
    return () => clearInterval(t)
  }, [stats?.next_scheduled_at, reload, loadStats])

  // ── search box: debounced into the URL ────────────────────────────────────

  // Follow the URL when it changes from outside the box (back button, Clear).
  const [urlQ, setUrlQ] = useState(params.q)
  if (params.q !== urlQ) {
    setUrlQ(params.q)
    setSearchText(params.q)
  }

  useEffect(() => {
    if (searchText === params.q) return
    const t = setTimeout(() => update({ q: searchText }), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [searchText, params.q, update])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── scroll position survives a trip to the editor ─────────────────────────

  const scrollKey = SCROLL_KEY + searchParams.toString()
  useEffect(() => {
    if (scrollRestored.current || !data) return
    scrollRestored.current = true
    try {
      const y = Number(sessionStorage.getItem(scrollKey))
      if (y) window.scrollTo(0, y)
    } catch { /* storage unavailable */ }
  }, [data, scrollKey])

  function openPost(id: string, newTab = false) {
    const url = `/admin/blogs/${id}/edit`
    if (newTab) { window.open(url, '_blank'); return }
    try { sessionStorage.setItem(scrollKey, String(window.scrollY)) } catch { /* ignore */ }
    navigate(url)
  }

  // ── selection & actions ───────────────────────────────────────────────────

  const items = data?.items ?? []
  const pageAllSelected = items.length > 0 && items.every((p) => selected.has(p.id))

  function toggleOne(post: PostListItem) {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(post.id)) next.delete(post.id)
      else next.set(post.id, post)
      return next
    })
  }

  function togglePage() {
    setSelected((prev) => {
      const next = new Map(prev)
      if (pageAllSelected) items.forEach((p) => next.delete(p.id))
      else items.forEach((p) => next.set(p.id, p))
      return next
    })
  }

  function summarize(action: BulkAction, res: BulkResult): string {
    const verb = action === 'archive' ? 'archived' : 'deleted'
    const parts = [`${res.succeeded.length} ${verb}`]
    if (res.failed.length) {
      const conflicts = res.failed.filter((f) => f.error === 'VERSION_CONFLICT').length
      parts.push(`${res.failed.length} skipped${conflicts ? ` (${conflicts} changed in another tab)` : ''}`)
    }
    return parts.join(' · ')
  }

  async function runBulk(action: BulkAction, posts: PostListItem[]) {
    if (posts.length === 0) return
    setBusy(true)
    try {
      const merged: BulkResult = { action, requested: 0, succeeded: [], failed: [] }
      for (let i = 0; i < posts.length; i += 100) {  // server cap per request
        const res = await bulkPosts(action, posts.slice(i, i + 100).map((p) => ({ id: p.id, version: p.version })))
        merged.requested += res.requested
        merged.succeeded.push(...res.succeeded)
        merged.failed.push(...res.failed)
      }
      showToast(summarize(action, merged))
      // Keep only what failed selected, so it can be retried or inspected.
      const failedIds = new Set(merged.failed.map((f) => f.id))
      setSelected((prev) => new Map([...prev].filter(([id]) => failedIds.has(id))))
    } catch (e) {
      showToast(errorText(e, `Could not ${action} posts.`))
    } finally {
      setBusy(false)
      setConfirmDelete(false)
      reload()
      loadStats()
    }
  }

  async function restore(post: PostListItem) {
    try {
      await unarchivePost(post.id, post.version)
      showToast(`“${post.title || 'Untitled draft'}” is back in drafts.`)
    } catch (e) {
      showToast(e instanceof BlogApiError && e.code === 'VERSION_CONFLICT'
        ? 'This post changed in another tab — refreshed.'
        : errorText(e, 'Could not restore the post.'))
    } finally {
      reload()
      loadStats()
    }
  }

  // ── render helpers ────────────────────────────────────────────────────────

  const facets = data?.facets
  const searching = params.q.trim().length >= 2
  const sortValue: ListSort = params.sort ?? (searching ? 'relevance' : 'updated_at')
  const filtersActive = params.status.length > 0 || params.category !== null || searching
  const selectedPosts = [...selected.values()]

  const activeFilterLabel = [
    params.status.map((v) => STATUS_PILLS.find((p) => p.value === v)?.label).join(' + '),
    params.category === 'none' ? 'Uncategorized' : categories.find((c) => c.id === params.category)?.name,
  ].filter(Boolean).join(' · ')

  return (
    <div className={s.page}>
      {toast && <div className={s.toast} role="status">{toast}</div>}

      <header className={s.pagehead}>
        <div>
          <h1>Blogs <span className={s.scribble}>/ Manage</span></h1>
          <nav className={s.crumbs}>
            <a href="/dashboard">Dashboard</a> › <span className={s.crumbCur}>Blogs</span>
          </nav>
        </div>
        <div className={s.meta}>
          {stats ? `${stats.total} posts · ${stats.draft} drafts` : ' '}
        </div>
      </header>

      <div className={s.layout}>
        <Sidebar activeItem="Blogs" />

        <main className={s.main} id="blog-list">
          {/* stats */}
          <div className={s.statsRow}>
            <div className={`${s.ministat} ${s.ministatDark}`}>
              <div className={s.statLabel}>Total posts</div>
              <div className={s.statNum}>{stats?.total ?? '–'}</div>
              <div className={`${s.statSub} ${stats?.created_this_month ? s.statUp : ''}`}>
                {stats?.created_this_month ? `▲ ${stats.created_this_month} this month` : 'none new this month'}
              </div>
            </div>
            <div className={s.ministat}>
              <div className={s.statLabel}>Published</div>
              <div className={s.statNum}>{stats?.published ?? '–'}</div>
              <div className={s.statSub}>live on the site</div>
            </div>
            <div className={s.ministat}>
              <div className={s.statLabel}>Drafts</div>
              <div className={s.statNum}>{stats?.draft ?? '–'}</div>
              <div className={`${s.statSub} ${stats?.failed_schedules ? s.statWarn : ''}`}>
                {stats?.failed_schedules ? `⚠ ${stats.failed_schedules} failed to publish` : 'in progress'}
              </div>
            </div>
            <div className={s.ministat}>
              <div className={s.statLabel}>Scheduled</div>
              <div className={s.statNum}>{stats?.scheduled ?? '–'}</div>
              <div className={s.statSub}>
                {stats?.next_scheduled_at ? `next: ${fmtWhen(stats.next_scheduled_at)}` : 'nothing queued'}
              </div>
            </div>
          </div>

          {/* toolbar */}
          <div className={s.toolbar}>
            <div className={s.searchWrap}>
              <span className={s.glass} aria-hidden="true" />
              <input
                ref={searchRef}
                className={s.searchInput}
                type="search"
                placeholder="Search posts by title, slug, tag, excerpt or content…"
                aria-label="Search posts"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') setSearchText('') }}
              />
              <span className={s.kbd}>⌘ K</span>
            </div>
            <div className={s.toolbarRight}>
              <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={() => navigate('/admin/blogs/new')}>
                <span className={s.plus}>+</span> New post
              </button>
            </div>
          </div>

          {/* pills */}
          <div className={s.pills}>
            <span className={s.pillLabel}>Status</span>
            <button
              type="button"
              className={`${s.pill} ${params.status.length === 0 ? s.pillActive : s.pillMuted}`}
              aria-pressed={params.status.length === 0}
              onClick={() => update({ status: [] })}
            >
              All <span className={s.count}>{facets?.status.all ?? ''}</span>
            </button>
            {STATUS_PILLS.map((p) => {
              const on = params.status.includes(p.value)
              return (
                <button
                  key={p.value}
                  type="button"
                  className={`${s.pill} ${on ? s.pillActive : ''}`}
                  aria-pressed={on}
                  onClick={() => update({ status: toggleStatus(params.status, p.value) })}
                >
                  <span className={`${s.dot} ${s[`dot_${p.dot}`]}`} /> {p.label}
                  <span className={s.count}>{facets?.status[p.value] ?? ''}</span>
                </button>
              )
            })}

            <span className={s.pillDivider} />
            <span className={s.pillLabel}>Category</span>
            <button
              type="button"
              className={`${s.pill} ${params.category === null ? s.pillActive : ''}`}
              aria-pressed={params.category === null}
              onClick={() => update({ category: null })}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`${s.pill} ${params.category === c.id ? s.pillActive : ''}`}
                aria-pressed={params.category === c.id}
                onClick={() => update({ category: params.category === c.id ? null : c.id })}
              >
                {c.name} <span className={s.count}>{facets?.category[c.id] ?? 0}</span>
              </button>
            ))}
            {((facets?.category.none ?? 0) > 0 || params.category === 'none') && (
              <button
                type="button"
                className={`${s.pill} ${params.category === 'none' ? s.pillActive : ''}`}
                aria-pressed={params.category === 'none'}
                onClick={() => update({ category: params.category === 'none' ? null : 'none' })}
              >
                Uncategorized <span className={s.count}>{facets?.category.none ?? 0}</span>
              </button>
            )}

            <span className={s.pillDivider} />
            <span className={s.pillLabel}>Sort</span>
            <select
              className={s.sortSelect}
              aria-label="Sort by"
              value={sortValue}
              onChange={(e) => update({ sort: e.target.value as ListSort, dir: null }, true)}
            >
              {searching && <option value="relevance">Best match</option>}
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {sortValue !== 'relevance' && (
              <button
                type="button"
                className={s.pill}
                aria-label="Reverse sort direction"
                onClick={() => {
                  const desc = params.dir ? params.dir === 'desc' : sortValue !== 'title'
                  update({ dir: desc ? 'asc' : 'desc' }, true)
                }}
              >
                {(params.dir ? params.dir === 'desc' : sortValue !== 'title') ? '↓' : '↑'}
              </button>
            )}
          </div>

          {/* bulk bar: only Archive and Delete (publishing lives in the editor) */}
          {selected.size > 0 && (
            <div className={s.bulkBar}>
              <span className={s.countBadge}>{selected.size} SELECTED</span>
              <span>What do you want to do with {selected.size === 1 ? 'this' : 'these'}?</span>
              <div className={s.bulkBtns}>
                <button type="button" className={s.bulkBtn} disabled={busy} onClick={() => runBulk('archive', selectedPosts)}>
                  ▭ Archive
                </button>
                <button type="button" className={`${s.bulkBtn} ${s.bulkDanger}`} disabled={busy} onClick={() => setConfirmDelete(true)}>
                  ✕ Delete
                </button>
                <button type="button" className={s.bulkBtn} onClick={() => setSelected(new Map())}>Clear</button>
              </div>
            </div>
          )}

          {/* table */}
          {error ? (
            <div className={s.empty}>
              <div className={s.emptyTitle}>Couldn't load posts</div>
              <p>{error}</p>
              <button type="button" className={s.btn} onClick={reload}>Try again</button>
            </div>
          ) : data && data.total === 0 && !loading ? (
            <div className={s.empty}>
              {filtersActive ? (
                <>
                  <div className={s.emptyTitle}>
                    No posts match{searching ? ` “${params.q.trim()}”` : ''}{activeFilterLabel ? ` in ${activeFilterLabel}` : ''}
                  </div>
                  <button type="button" className={s.btn} onClick={() => { setSearchText(''); update({ status: [], category: null, q: '' }) }}>
                    Clear filters
                  </button>
                </>
              ) : (
                <>
                  <div className={s.emptyTitle}>✎ No posts yet</div>
                  <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={() => navigate('/admin/blogs/new')}>
                    Write your first post
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className={`${s.tableWrap} ${loading && data ? s.loading : ''}`}>
              <table className={s.posts}>
                <thead>
                  <tr>
                    <th className={s.colCheck}>
                      <input type="checkbox" className={s.check} aria-label="Select all on this page"
                        checked={pageAllSelected} onChange={togglePage} />
                    </th>
                    <th className={s.colCover}>Cover</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Category</th>
                    <th>Tags</th>
                    <th>Read</th>
                    <th>Views</th>
                    <th>Date</th>
                    <th className={s.colActions}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!data && loading && (
                    <tr><td colSpan={10} className={s.loadingRow}>Loading posts…</td></tr>
                  )}
                  {items.map((post) => (
                    <PostRow
                      key={post.id}
                      post={post}
                      selected={selected.has(post.id)}
                      onToggle={() => toggleOne(post)}
                      onOpen={(newTab) => openPost(post.id, newTab)}
                      onArchive={() => runBulk('archive', [post])}
                      onRestore={() => restore(post)}
                      busy={busy}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data && (
            <div className={s.tableFoot}>
              <Pagination
                total={data.total}
                page={params.page}
                limit={LIST_PAGE_SIZE}
                setPage={(page) => update({ page }, true)}
                scrollTargetId="blog-list"
              />
              {data.total_pages <= 1 && data.total > 0 && (
                <span className={s.footText}>
                  {data.total} post{data.total === 1 ? '' : 's'}{selected.size ? ` · ${selected.size} selected` : ''}
                </span>
              )}
            </div>
          )}
        </main>
      </div>

      {confirmDelete && (
        <ConfirmDeleteModal
          posts={selectedPosts}
          busy={busy}
          onCancel={() => setConfirmDelete(false)}
          onDelete={(posts) => runBulk('delete', posts)}
          onArchiveInstead={(posts) => runBulk('archive', posts)}
        />
      )}
    </div>
  )
}

// ── row ──────────────────────────────────────────────────────────────────────

interface RowProps {
  post: PostListItem
  selected: boolean
  busy: boolean
  onToggle: () => void
  onOpen: (newTab: boolean) => void
  onArchive: () => void
  onRestore: () => void
}

function PostRow({ post, selected, busy, onToggle, onOpen, onArchive, onRestore }: RowProps) {
  const stop = (e: React.SyntheticEvent) => e.stopPropagation()
  const visibleTags = post.tags.slice(0, 3)
  const snippet = post.search?.snippet

  return (
    <tr
      className={`${s.row} ${selected ? s.rowSelected : ''}`}
      onClick={(e) => onOpen(e.metaKey || e.ctrlKey)}
      onAuxClick={(e) => { if (e.button === 1) onOpen(true) }}
    >
      <td onClick={stop}>
        <input type="checkbox" className={s.check} aria-label={`Select ${post.title || 'untitled draft'}`}
          checked={selected} onChange={onToggle} />
      </td>
      <td>
        {post.cover
          ? <img className={s.cover} src={post.cover.thumb_url} alt="" loading="lazy" />
          : <div className={`${s.cover} ${s.coverEmpty}`} />}
      </td>
      <td className={s.titleCell}>
        <Link to={`/admin/blogs/${post.id}/edit`} className={`${s.title} ${post.title ? '' : s.untitled}`}
          onClick={(e) => { e.stopPropagation(); if (!e.metaKey && !e.ctrlKey) { e.preventDefault(); onOpen(false) } }}>
          {post.title || 'Untitled draft'}
        </Link>
        {snippet
          ? <span className={s.excerpt} dangerouslySetInnerHTML={{ __html: snippet }} />
          : post.excerpt && <span className={s.excerpt}>{post.excerpt}</span>}
        <span className={s.slug}>/blog/{post.slug}</span>
      </td>
      <td><StatusChip post={post} /></td>
      <td>
        {post.category
          ? <span className={s.catBadge}>{post.category.name}</span>
          : <span className={s.faint}>—</span>}
      </td>
      <td>
        <div className={s.tagRow}>
          {visibleTags.map((t) => <span key={t} className={s.tagChip}>{t}</span>)}
          {post.tags.length > 3 && <span className={`${s.tagChip} ${s.tagMore}`}>+{post.tags.length - 3}</span>}
        </div>
      </td>
      <td className={s.reading}>
        {post.read_time ? <><b>{post.status === 'draft' ? '~' : ''}{post.read_time}</b> min</> : <span className={s.faint}>—</span>}
      </td>
      <td className={s.reading}>
        {post.status === 'published' || post.published_at ? <b>{fmtCount(post.views)}</b> : <span className={s.faint}>—</span>}
      </td>
      <td className={s.dateCell}><DateCell post={post} /></td>
      <td onClick={stop}>
        <div className={s.rowActions}>
          <Link to={`/admin/blogs/${post.id}/edit`} className={s.iconBtn} title="Edit" aria-label="Edit">✎</Link>
          {post.status === 'archived' ? (
            <button type="button" className={s.iconBtn} title="Restore to drafts" aria-label="Restore to drafts"
              disabled={busy} onClick={onRestore}>↺</button>
          ) : (
            <button type="button" className={`${s.iconBtn} ${s.iconDanger}`} title="Archive" aria-label="Archive"
              disabled={busy} onClick={onArchive}>▭</button>
          )}
        </div>
      </td>
    </tr>
  )
}

function StatusChip({ post }: { post: PostListItem }) {
  if (post.status === 'published') {
    return (
      <span className={s.statusStack}>
        <span className={`${s.status} ${s.statusPublished}`}>● Published</span>
        {post.has_unpublished_changes && <span className={s.statusNote}>unpublished edits</span>}
      </span>
    )
  }
  if (post.status === 'scheduled' && post.scheduled_at) {
    return (
      <span className={s.statusStack}>
        <span className={`${s.status} ${s.statusScheduled}`}>● Scheduled</span>
        <span className={s.statusNote}>{fmtWhen(post.scheduled_at)}</span>
      </span>
    )
  }
  if (post.status === 'archived') {
    return <span className={`${s.status} ${s.statusArchived}`}>▭ Archived</span>
  }
  return (
    <span className={s.statusStack}>
      <span className={`${s.status} ${s.statusDraft}`}>○ Draft</span>
      <span className={s.statusNote}>{post.word_count.toLocaleString('en-US')} words</span>
      {post.schedule_error && (
        <span className={s.scheduleError} title={post.schedule_error}>⚠ Schedule failed</span>
      )}
    </span>
  )
}

function DateCell({ post }: { post: PostListItem }) {
  const author = post.author?.name ?? ''
  let date: string
  if (post.status === 'archived' && post.archived_at) date = `archived ${fmtRelative(post.archived_at)}`
  else if (post.status === 'scheduled' && post.scheduled_at) date = `${fmtDateTime(post.scheduled_at)} IST`
  else if (post.status === 'published' && post.published_at) date = fmtDateTime(post.published_at)
  else date = `edited ${fmtRelative(post.updated_at)}`
  return (
    <>
      <span className={s.who}>{author}</span>
      <span className={s.date}>{date}</span>
    </>
  )
}

// ── delete confirmation ──────────────────────────────────────────────────────

interface ConfirmProps {
  posts: PostListItem[]
  busy: boolean
  onCancel: () => void
  onDelete: (posts: PostListItem[]) => void
  onArchiveInstead: (posts: PostListItem[]) => void
}

function ConfirmDeleteModal({ posts, busy, onCancel, onDelete, onArchiveInstead }: ConfirmProps) {
  const deletable = posts.filter(canDelete)
  const blocked = posts.filter((p) => !canDelete(p))
  const archivable = blocked.filter((p) => p.status !== 'archived')
  // Typing "delete" guards large or irreversible deletes (API M5).
  const needsTyping = deletable.length > 5 || deletable.some((p) => p.status === 'archived' && p.published_at)
  const [typed, setTyped] = useState('')
  const canConfirm = deletable.length > 0 && (!needsTyping || typed.trim().toLowerCase() === 'delete')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const name = (p: PostListItem) => p.title || 'Untitled draft'

  return (
    <div className={s.backdrop} onClick={onCancel}>
      <div className={s.modal} role="dialog" aria-modal="true" aria-labelledby="del-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="del-title" className={s.modalTitle}>
          {deletable.length > 0
            ? `Delete ${deletable.length} post${deletable.length === 1 ? '' : 's'} for good?`
            : 'These posts can’t be deleted'}
        </h2>

        {deletable.length > 0 && (
          <>
            <p className={s.modalText}>This can’t be undone. Revisions and redirects go with them.</p>
            <ul className={s.modalList}>
              {deletable.map((p) => <li key={p.id}>{name(p)}</li>)}
            </ul>
          </>
        )}

        {blocked.length > 0 && (
          <div className={s.modalWarn}>
            <b>{blocked.length} of {posts.length}</b> {blocked.length === 1 ? 'has' : 'have'} been live or {blocked.length === 1 ? 'is' : 'are'} scheduled,
            so {blocked.length === 1 ? 'it' : 'they'} can’t be deleted — archive instead:
            <ul className={s.modalList}>
              {blocked.map((p) => <li key={p.id}>{name(p)} <span className={s.faint}>({p.status})</span></li>)}
            </ul>
          </div>
        )}

        {needsTyping && deletable.length > 0 && (
          <label className={s.modalType}>
            Type <b>delete</b> to confirm
            <input autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} />
          </label>
        )}

        <div className={s.modalBtns}>
          <button type="button" className={s.btn} onClick={onCancel}>Cancel</button>
          {archivable.length > 0 && (
            <button type="button" className={s.btn} disabled={busy} onClick={() => onArchiveInstead(archivable)}>
              ▭ Archive {archivable.length === blocked.length ? 'those' : archivable.length} instead
            </button>
          )}
          {deletable.length > 0 && (
            <button type="button" className={`${s.btn} ${s.btnDanger}`} disabled={!canConfirm || busy}
              onClick={() => onDelete(deletable)}>
              ✕ Delete {deletable.length}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
