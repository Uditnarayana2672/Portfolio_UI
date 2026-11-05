import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import {
  archiveProject,
  bulkAction,
  deleteProject,
  duplicateProject,
  getStatusCounts,
  listProjects,
  publishProject,
  toggleFeature,
  type ProjectSummary,
  type StatusCounts,
} from '../api/projectApi'
import styles from './ProjectManagerPage.module.css'

// ── Helpers ───────────────────────────────────────────────────────────────────

const TEMPLATE_LABELS: Record<string, string> = {
  narrative:    'Narrative',
  'case-study': 'Technical',
  gallery:      'Visual',
  minimal:      'Minimal',
  interactive:  'Interactive',
}

const TEMPLATE_FILTER_OPTIONS = [
  { label: 'Narrative',    value: 'narrative' },
  { label: 'Technical',   value: 'case-study' },
  { label: 'Visual',      value: 'gallery' },
  { label: 'Minimal',     value: 'minimal' },
  { label: 'Interactive', value: 'interactive' },
]

function fmtRelative(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (m < 60) return m <= 1 ? 'just now' : `${m}m ago`
  if (h < 24) return `${h}h ago`
  if (d === 1) return 'yesterday'
  if (d < 7) return `${d}d ago`
  if (d < 30) return `${Math.floor(d / 7)}w ago`
  if (d < 365) return `${Math.floor(d / 30)}mo ago`
  return `${Math.floor(d / 365)}y ago`
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

function fmtViews(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProjectManagerPage() {
  const navigate = useNavigate()

  // ── Data state ──────────────────────────────────────────────────────────────
  const [projects, setProjects]     = useState<ProjectSummary[]>([])
  const [total, setTotal]           = useState(0)
  const [counts, setCounts]         = useState<StatusCounts>({ total: 0, draft: 0, published: 0, archived: 0 })
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  // ── Filters / sort / pagination ─────────────────────────────────────────────
  const [search, setSearch]         = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [templateFilter, setTemplateFilter] = useState<string | null>(null)
  const [sortBy, setSortBy]         = useState('updated_at')
  const [sortDir, setSortDir]       = useState<'asc' | 'desc'>('desc')
  const [page, setPage]             = useState(1)
  const PAGE_SIZE = 20

  // ── Selection ────────────────────────────────────────────────────────────────
  const [selected, setSelected]     = useState<Set<string>>(new Set())

  // ── Toast ────────────────────────────────────────────────────────────────────
  const [toast, setToast]           = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  // ── Debounce search ──────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // ── Fetch data ───────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [listRes, countsRes] = await Promise.all([
        listProjects({
          status_filter: statusFilter ?? undefined,
          search: debouncedSearch || undefined,
          page,
          page_size: PAGE_SIZE,
          template_id: templateFilter ?? undefined,
          sort_by: sortBy,
          sort_dir: sortDir,
        }),
        getStatusCounts(),
      ])
      setProjects(listRes.items)
      setTotal(listRes.total)
      setCounts(countsRes)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, debouncedSearch, page, templateFilter, sortBy, sortDir])

  useEffect(() => { fetchData() }, [fetchData])

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1) }, [statusFilter, debouncedSearch, templateFilter, sortBy, sortDir])

  // Clear selection on page/filter change
  useEffect(() => { setSelected(new Set()) }, [projects])

  // ── Selection helpers ────────────────────────────────────────────────────────
  const allSelected = projects.length > 0 && projects.every(p => selected.has(p.id))

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(projects.map(p => p.id)))
    }
  }

  // ── Sort toggle ──────────────────────────────────────────────────────────────
  function handleSort(col: string) {
    if (sortBy === col) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(col)
      setSortDir('desc')
    }
  }

  // ── Row actions ──────────────────────────────────────────────────────────────
  async function handleArchive(id: string) {
    try {
      await archiveProject(id)
      showToast('Project archived.')
      fetchData()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Archive failed')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Permanently delete this project and all its blocks?')) return
    try {
      await deleteProject(id)
      showToast('Project deleted.')
      fetchData()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await duplicateProject(id)
      showToast('Project duplicated.')
      fetchData()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Duplicate failed')
    }
  }

  async function handlePublishOne(id: string) {
    try {
      await publishProject(id)
      showToast('Project published.')
      fetchData()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Publish failed')
    }
  }

  async function handleToggleFeature(id: string, current: boolean) {
    try {
      await toggleFeature(id, !current)
      showToast(!current ? 'Project featured.' : 'Project unfeatured.')
      fetchData()
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Feature toggle failed')
    }
  }

  // ── Bulk actions ─────────────────────────────────────────────────────────────
  async function handleBulk(action: 'publish' | 'archive' | 'feature' | 'delete') {
    const ids = [...selected]
    if (ids.length === 0) return
    if (action === 'delete' && !confirm(`Permanently delete ${ids.length} project(s)?`)) return
    try {
      const res = await bulkAction(action, ids)
      showToast(`${action}: ${res.succeeded} succeeded${res.skipped ? `, ${res.skipped} skipped` : ''}.`)
      fetchData()
    } catch (e) {
      showToast(e instanceof Error ? e.message : `Bulk ${action} failed`)
    }
  }

  // ── Pagination ───────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: 'var(--ink)', color: 'var(--paper)',
          padding: '10px 20px', fontFamily: 'Caveat, cursive', fontSize: 20,
          border: '2px solid var(--ink)', boxShadow: '4px 4px 0 var(--accent)',
        }}>
          {toast}
        </div>
      )}

      <header className={styles.pagehead}>
        <div>
          <h1>Projects <span className={styles.scribble}>/ Manage</span></h1>
          <nav className={styles.crumbs}>
            <a href="/dashboard">Dashboard</a>{' › '}Projects
          </nav>
        </div>
        <div className={styles.meta}>
          {counts.total} projects · {counts.draft} drafts
        </div>
      </header>

      <div className={styles.layout}>
        <Sidebar activeItem="Projects" />

        <main className={styles.main}>
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <span className={styles.glass} />
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Search projects by title, slug, or tech…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <span className={styles.kbd}>⌘ K</span>
            </div>
            <div className={styles.toolbarRight}>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={() => navigate('/admin/projects/new')}
              >
                <span className={styles.plus}>+</span> New project
              </button>
            </div>
          </div>

          {/* Filter pills */}
          <div className={styles.pills}>
            <span className={styles.pillLabel}>Status</span>
            {([
              { label: 'All',       value: null,        dot: null },
              { label: 'Published', value: 'published', dot: 'ok' },
              { label: 'Archived',  value: 'archived',  dot: 'archived' },
              { label: 'Drafts',    value: 'draft',     dot: 'draft' },
            ] as const).map(({ label, value, dot }) => {
              const count = value === null ? counts.total
                : value === 'published' ? counts.published
                : value === 'archived'  ? counts.archived
                : counts.draft
              const active = statusFilter === value
              return (
                <span
                  key={label}
                  className={`${styles.pill}${active ? ` ${styles.pillActive}` : ''}`}
                  onClick={() => setStatusFilter(value)}
                >
                  {dot && (
                    <span className={`${styles.pillDot} ${
                      dot === 'ok' ? styles.dotOk :
                      dot === 'archived' ? styles.dotArchived :
                      styles.dotDraft
                    }`} />
                  )}
                  {label}
                  <span className={styles.pillCount}>{count}</span>
                </span>
              )
            })}

            <span className={styles.pillDivider} />
            <span className={styles.pillLabel}>Template</span>
            {TEMPLATE_FILTER_OPTIONS.map(({ label, value }) => (
              <span
                key={value}
                className={`${styles.pill}${templateFilter === value ? ` ${styles.pillActive}` : ''}`}
                onClick={() => setTemplateFilter(templateFilter === value ? null : value)}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Bulk bar */}
          {selected.size > 0 && (
            <div className={styles.bulkBar}>
              <span className={styles.bulkCountBadge}>{selected.size} SELECTED</span>
              <span>What do you want to do with these?</span>
              <div className={styles.bulkBtns}>
                <button className={styles.bulkBtn} onClick={() => handleBulk('publish')}>✓ Publish</button>
                <button className={styles.bulkBtn} onClick={() => handleBulk('feature')}>★ Feature</button>
                <button className={styles.bulkBtn} onClick={() => handleBulk('archive')}>⊟ Archive</button>
                <button className={`${styles.bulkBtn} ${styles.bulkBtnDanger}`} onClick={() => handleBulk('delete')}>✕ Delete</button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: '12px 16px', border: '2px solid var(--accent)', marginBottom: 14, fontFamily: 'Patrick Hand, sans-serif', color: 'var(--accent)' }}>
              {error} — <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', textDecoration: 'underline' }} onClick={fetchData}>Retry</button>
            </div>
          )}

          {/* Table */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thCheck}>
                    <span
                      className={`${styles.check}${allSelected ? ` ${styles.checkOn}` : ''}`}
                      onClick={toggleAll}
                    />
                  </th>
                  <th className={styles.thCover}>Cover</th>
                  <th
                    className={styles.thSortable}
                    onClick={() => handleSort('title')}
                  >
                    Title {sortBy === 'title' && <span className={styles.sortArr}>{sortDir === 'desc' ? '↓' : '↑'}</span>}
                  </th>
                  <th>Status</th>
                  <th>Template</th>
                  <th>Tech stack</th>
                  <th>Stats</th>
                  <th
                    className={styles.thSortable}
                    onClick={() => handleSort('updated_at')}
                  >
                    Modified {sortBy === 'updated_at' && <span className={styles.sortArr}>{sortDir === 'desc' ? '↓' : '↑'}</span>}
                  </th>
                  <th className={styles.thActions}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && projects.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: 40, fontFamily: 'Caveat, cursive', fontSize: 22, color: 'var(--ink-soft)' }}>
                      Loading…
                    </td>
                  </tr>
                ) : projects.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: 40, fontFamily: 'Caveat, cursive', fontSize: 22, color: 'var(--ink-soft)' }}>
                      No projects found.{' '}
                      <span
                        style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => navigate('/admin/projects/new')}
                      >
                        Create one?
                      </span>
                    </td>
                  </tr>
                ) : projects.map(p => {
                  const isSelected = selected.has(p.id)
                  const visibleTech = p.tech_stack.slice(0, 3)
                  const extraTech = p.tech_stack.length - 3

                  return (
                    <tr key={p.id} className={isSelected ? styles.rowSelected : undefined}>
                      {/* Checkbox */}
                      <td>
                        <span
                          className={`${styles.check}${isSelected ? ` ${styles.checkOn}` : ''}`}
                          onClick={() => toggleSelect(p.id)}
                        />
                      </td>

                      {/* Cover */}
                      <td>
                        <div className={`${styles.thumb}${p.is_featured ? ` ${styles.thumbFeatured}` : ''}`}>
                          {p.thumbnail_url && (
                            <img
                              src={p.thumbnail_url}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                          )}
                        </div>
                      </td>

                      {/* Title */}
                      <td>
                        <div className={styles.titleCell}>
                          <div>
                            <span
                              className={styles.titleName}
                              onClick={() => navigate(`/admin/projects/${p.id}/edit`)}
                            >
                              {p.title}
                            </span>
                            <span className={styles.titleSlug}>/projects/{p.slug}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`${styles.statusBadge} ${
                          p.status === 'published' ? styles.statusActive :
                          p.status === 'archived'  ? styles.statusArchived :
                          styles.statusDraft
                        }`}>
                          {p.status === 'published' ? '● Active' :
                           p.status === 'archived'  ? '○ Archived' :
                           '· Draft'}
                        </span>
                      </td>

                      {/* Template */}
                      <td>
                        <span className={styles.tplBadge}>
                          {TEMPLATE_LABELS[p.template_id] ?? p.template_id}
                        </span>
                      </td>

                      {/* Tech stack */}
                      <td>
                        <div className={styles.techRow}>
                          {visibleTech.map(t => (
                            <span key={t} className={styles.techChip}>{t}</span>
                          ))}
                          {extraTech > 0 && (
                            <span className={`${styles.techChip} ${styles.techChipMore}`}>+{extraTech}</span>
                          )}
                        </div>
                      </td>

                      {/* Stats */}
                      <td>
                        {p.status === 'draft' ? (
                          <span className={styles.statNotPublished}>— not yet published —</span>
                        ) : (
                          <div className={styles.statMini}>
                            <span><b>{fmtViews(p.views)}</b> views</span>
                            <span><b>{p.reactions_count}</b> reactions</span>
                          </div>
                        )}
                      </td>

                      {/* Modified */}
                      <td>
                        <div className={styles.modified}>
                          <span className={styles.modifiedRel}>{fmtRelative(p.updated_at)}</span>
                          {fmtDate(p.updated_at)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className={styles.rowActions}>
                          <button
                            className={styles.iconBtn}
                            title="Open editor"
                            onClick={() => navigate(`/admin/projects/${p.id}/edit`)}
                          >✎</button>
                          <button
                            className={styles.iconBtn}
                            title={p.is_featured ? 'Unfeature' : 'Feature'}
                            onClick={() => handleToggleFeature(p.id, p.is_featured)}
                          >{p.is_featured ? '★' : '☆'}</button>
                          <button
                            className={styles.iconBtn}
                            title="Duplicate"
                            onClick={() => handleDuplicate(p.id)}
                          >⧉</button>
                          {p.status === 'draft' && (
                            <button
                              className={styles.iconBtn}
                              title="Publish"
                              onClick={() => handlePublishOne(p.id)}
                            >↑</button>
                          )}
                          {p.status !== 'archived' && (
                            <button
                              className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                              title="Archive"
                              onClick={() => handleArchive(p.id)}
                            >⊟</button>
                          )}
                          <button
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            title="Delete permanently"
                            onClick={() => handleDelete(p.id)}
                          >✕</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="table-foot" style={{
            marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
            color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '1.5px',
          }}>
            <span>
              Showing {projects.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} projects
              {selected.size > 0 && ` · ${selected.size} selected`}
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <PageBtn disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</PageBtn>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const n = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                return n <= totalPages ? (
                  <PageBtn key={n} active={n === page} onClick={() => setPage(n)}>{n}</PageBtn>
                ) : null
              })}
              <PageBtn disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</PageBtn>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// ── PageBtn helper ────────────────────────────────────────────────────────────

function PageBtn({
  children, active, disabled, onClick,
}: {
  children: React.ReactNode
  active?: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: 28, height: 28,
        border: `1.5px solid ${disabled ? 'var(--ink-faint)' : 'var(--ink)'}`,
        background: active ? 'var(--ink)' : 'var(--paper)',
        color: active ? 'var(--paper)' : disabled ? 'var(--ink-faint)' : 'var(--ink)',
        fontFamily: 'Patrick Hand, sans-serif',
        fontSize: 14, cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '0 8px',
      }}
    >
      {children}
    </button>
  )
}
