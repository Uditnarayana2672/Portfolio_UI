import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import { getProject, publishProject, type ProjectDetail } from '../api/projectApi'
import { buildProjectDetailHtml } from '../lib/renderProjectDetail'
import pageStyles from './NewProjectPage.module.css'
import s from '../components/newProject/Step5Publish.module.css'

// ── Constants ──────────────────────────────────────────────────────────────────

const BLOCK_ICONS: Record<string, string> = {
  hero: '⬚', text: '¶', image: '⊞', code: '</>',
  gallery: '⊟', video: '▶', quote: '"', stats: '≡',
  comparison: '⇄', timeline: '○', poll: '◉', form: '☐', cta: '→',
}

const BLOCK_LABELS: Record<string, string> = {
  hero: 'Hero', text: 'Text', image: 'Image', code: 'Code',
  gallery: 'Gallery', video: 'Video', quote: 'Quote', stats: 'Stats',
  comparison: 'Comparison', timeline: 'Timeline', poll: 'Poll', form: 'Form', cta: 'CTA',
}

const TEMPLATE_LABELS: Record<string, string> = {
  narrative:   'Narrative',
  'case-study': 'Technical',
  gallery:     'Visual',
  minimal:     'Minimal',
  interactive: 'Interactive',
}

const DOMAIN = 'uditnarayana.dev'

// ── Sub-components ─────────────────────────────────────────────────────────────

function CheckRow({ pass, warn = false, label }: { pass: boolean; warn?: boolean; label: string }) {
  const cls = pass ? s.pass : warn ? s.warn : s.fail
  return (
    <div className={`${s.checkRow} ${cls}`}>
      <span className={s.checkIcon}>{pass ? '✓' : warn ? '⚠' : '○'}</span>
      <span>{label}</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProjectPreviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [project, setProject]     = useState<ProjectDetail | null>(null)
  const [loading, setLoading]     = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [toast, setToast]         = useState<string | null>(null)
  const [device, setDevice]       = useState<'desktop' | 'mobile'>('desktop')
  const toastTimer                = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Full working public "Project Detail" page, rendered from live data.
  const previewHtml = useMemo(
    () => (project ? buildProjectDetailHtml(project) : ''),
    [project],
  )

  function showToast(msg: string) {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    if (!id) return
    getProject(id)
      .then(setProject)
      .catch(e => setLoadError(e instanceof Error ? e.message : 'Failed to load project'))
      .finally(() => setLoading(false))
  }, [id])

  async function handlePublish() {
    if (!id) return
    setPublishing(true)
    try {
      await publishProject(id)
      showToast('Project published!')
      // Refresh to reflect new status
      const updated = await getProject(id)
      setProject(updated)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Publish failed')
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, fontFamily: 'Caveat, cursive', fontSize: 28, color: 'var(--ink-soft)' }}>
        Loading preview…
      </div>
    )
  }

  if (loadError || !project) {
    return (
      <div style={{ padding: 60, fontFamily: 'Patrick Hand, sans-serif', color: 'var(--accent)', fontSize: 18 }}>
        {loadError ?? 'Project not found'}
        {' — '}
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', textDecoration: 'underline', fontSize: 'inherit', fontFamily: 'inherit' }}
          onClick={() => navigate('/admin/projects')}
        >
          Back to projects
        </button>
      </div>
    )
  }

  // ── Readiness ──────────────────────────────────────────────────────────────
  const hasTitle    = project.title.trim().length > 0
  const hasSlug     = project.slug.trim().length > 0
  const hasBlocks   = project.blocks.length > 0
  const hasSeoTitle = !!project.seo.meta_title?.trim()
  const hasExcerpt  = !!project.excerpt?.trim()
  const hasThumb    = !!project.thumbnail_url
  const hasSeoDesc  = !!project.seo.meta_description?.trim()
  const canPublish  = hasTitle && hasSlug && hasBlocks && hasSeoTitle && project.status !== 'published'
  const isPublished = project.status === 'published'

  const serpTitle = project.seo.meta_title?.trim() || project.title || 'Untitled'
  const serpDesc  = project.seo.meta_description?.trim() || project.excerpt || 'No description set.'

  const techStack = project.tech_stack
  const sortedBlocks = project.blocks.slice().sort((a, b) => a.position - b.position)

  return (
    <div className={pageStyles.page}>
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

      {/* Page header */}
      <header className={pageStyles.pagehead}>
        <div>
          <h1>Preview <span className={pageStyles.scribble}>/ {project.title}</span></h1>
          <nav className={pageStyles.crumbs}>
            <a href="/dashboard">Dashboard</a>{' › '}
            <a href="/admin/projects">Projects</a>{' › '}
            <span
              style={{ cursor: 'pointer', borderBottom: '1px dashed var(--ink-faint)', color: 'var(--ink-soft)' }}
              onClick={() => navigate(`/admin/projects/${id}/edit`)}
            >
              Edit
            </span>
            {' › '}
            <span className={pageStyles.crumbCur}>Preview</span>
          </nav>
        </div>
        <div className={pageStyles.meta}>
          {isPublished ? '● Published' : '· Draft'}
        </div>
      </header>

      <div className={pageStyles.layout}>
        <Sidebar activeItem="Projects" />

        <main className={pageStyles.main}>
          <div className={`${pageStyles.builder} wobble`}>

            {/* Top bar */}
            <div className={pageStyles.bTop}>
              <div className={pageStyles.bCrumb}>
                <button
                  className={pageStyles.bCrumbBack}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit', padding: 0 }}
                  onClick={() => navigate(`/admin/projects/${id}/edit`)}
                >
                  ← Edit
                </button>
                <span className={pageStyles.bCrumbArrow}>/</span>
                <span className={pageStyles.bCrumbCur}>Preview</span>
              </div>
              <div className={pageStyles.topActs}>
                <button
                  className={`${pageStyles.btn} ${pageStyles.btnGhost}`}
                  onClick={() => navigate('/admin/projects')}
                >
                  Back to list
                </button>
                {!isPublished && (
                  <button
                    className={`${pageStyles.btn} ${pageStyles.btnPrimary}`}
                    onClick={handlePublish}
                    disabled={!canPublish || publishing}
                  >
                    {publishing ? 'Publishing…' : '↑ Publish'}
                  </button>
                )}
              </div>
            </div>

            {/* Preview body */}
            <div className={pageStyles.bBody}>

              {/* ── Live working model of the public Project Detail page ── */}
              <div style={{ marginBottom: 32 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 12, gap: 12, flexWrap: 'wrap',
                }}>
                  <div style={{ fontFamily: 'Patrick Hand, sans-serif', fontSize: 18, color: 'var(--ink)' }}>
                    Live page preview
                    <span style={{ color: 'var(--ink-faint)', fontSize: 14 }}> · the real Project Detail page</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className={`${pageStyles.btn} ${device === 'desktop' ? pageStyles.btnPrimary : pageStyles.btnGhost}`}
                      onClick={() => setDevice('desktop')}
                    >
                      ▭ Desktop
                    </button>
                    <button
                      className={`${pageStyles.btn} ${device === 'mobile' ? pageStyles.btnPrimary : pageStyles.btnGhost}`}
                      onClick={() => setDevice('mobile')}
                    >
                      ▯ Mobile
                    </button>
                  </div>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'center',
                  background: '#14130F', border: '2px solid var(--ink)',
                  boxShadow: '4px 4px 0 var(--accent-soft)',
                  borderRadius: 10, padding: device === 'mobile' ? '20px 0' : 0,
                  overflow: 'hidden',
                }}>
                  <iframe
                    title="Project detail — live preview"
                    srcDoc={previewHtml}
                    sandbox="allow-scripts allow-popups"
                    style={{
                      width: device === 'mobile' ? 390 : '100%',
                      maxWidth: '100%',
                      height: 760,
                      border: 0,
                      borderRadius: device === 'mobile' ? 24 : 8,
                      background: '#1A1815',
                      display: 'block',
                    }}
                  />
                </div>
              </div>

              <div className={s.root}>

                <div className={s.intro}>
                  <span className={s.introIcon}>⊙</span>
                  <div>
                    <div className={s.introTitle}>Project Preview</div>
                    <p className={s.introBody}>
                      This is how your project will appear. Check the readiness list on the right before publishing.
                    </p>
                  </div>
                </div>

                <div className={s.cols}>

                  {/* ── Left: project card + SERP ── */}
                  <div className={s.previewCol}>

                    {/* Project card */}
                    <div className={s.card}>
                      <div className={s.cardTag}>project card</div>

                      {project.thumbnail_url
                        ? <img className={s.thumb} src={project.thumbnail_url} alt="thumbnail" />
                        : <div className={s.thumbEmpty}>no thumbnail set</div>
                      }

                      <div className={s.cardBody}>
                        <div className={s.metaRow}>
                          <span className={s.tplBadge}>
                            {TEMPLATE_LABELS[project.template_id] ?? project.template_id}
                          </span>
                          <span className={`${s.statusBadge} ${isPublished ? s.s_active : s.s_draft}`}>
                            {isPublished ? '● Published' : '· Draft'}
                          </span>
                          {project.is_featured && (
                            <span className={s.featuredBadge}>★ Featured</span>
                          )}
                        </div>

                        <h2 className={s.previewTitle}>{project.title || 'Untitled project'}</h2>
                        <div className={s.previewSlug}>/{project.slug || 'no-slug-set'}</div>

                        {project.excerpt && (
                          <p className={s.previewExcerpt}>{project.excerpt}</p>
                        )}

                        {techStack.length > 0 && (
                          <div className={s.techRow}>
                            {techStack.map(t => (
                              <span key={t} className={s.techChip}>{t}</span>
                            ))}
                          </div>
                        )}

                        {sortedBlocks.length > 0 && (
                          <div className={s.blocksSection}>
                            <span className={s.blocksLabel}>
                              {sortedBlocks.length} block{sortedBlocks.length !== 1 ? 's' : ''}
                            </span>
                            <div className={s.blockPills}>
                              {sortedBlocks.map(b => (
                                <span key={b.id} className={s.blockPill}>
                                  {BLOCK_ICONS[b.block_type] ?? '▪'} {BLOCK_LABELS[b.block_type] ?? b.block_type}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {(project.github_url || project.demo_url) && (
                          <div className={s.linksRow}>
                            {project.github_url && <span className={s.linkChip}>⌥ GitHub</span>}
                            {project.demo_url   && <span className={s.linkChip}>↗ Live demo</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SERP snippet */}
                    <div className={s.card}>
                      <div className={s.cardTag}>seo preview</div>
                      <div className={s.serp}>
                        <div className={s.serpDomain}>
                          {DOMAIN} › projects › {project.slug || '…'}
                        </div>
                        <div className={s.serpTitle}>{serpTitle}</div>
                        <div className={s.serpDesc}>{serpDesc}</div>
                      </div>
                    </div>

                  </div>

                  {/* ── Right: checklist + actions ── */}
                  <div className={s.panel}>

                    <div className={s.checklist}>
                      <div className={s.cardTag}>readiness checklist</div>
                      <CheckRow pass={hasTitle}
                        label={hasTitle ? `Title: "${project.title}"` : 'Title — required'} />
                      <CheckRow pass={hasSlug}
                        label={hasSlug ? `Slug: /${project.slug}` : 'Slug — required'} />
                      <CheckRow pass={hasBlocks}
                        label={hasBlocks
                          ? `${sortedBlocks.length} content block${sortedBlocks.length !== 1 ? 's' : ''} added`
                          : 'At least 1 content block — required'} />
                      <CheckRow pass={hasSeoTitle}
                        label={hasSeoTitle ? 'SEO title set' : 'SEO title — required to publish'} />
                      <CheckRow pass={hasExcerpt} warn={!hasExcerpt}
                        label={hasExcerpt ? 'Excerpt filled in' : 'Excerpt — recommended'} />
                      <CheckRow pass={hasThumb} warn={!hasThumb}
                        label={hasThumb ? 'Thumbnail uploaded' : 'Thumbnail — recommended'} />
                      <CheckRow pass={hasSeoDesc} warn={!hasSeoDesc}
                        label={hasSeoDesc ? 'Meta description set' : 'Meta description — recommended'} />
                    </div>

                    <div className={s.actions}>
                      {isPublished ? (
                        <div style={{ fontFamily: 'Patrick Hand, sans-serif', fontSize: 16, color: 'var(--ok)', border: '2px solid var(--ok)', padding: '10px 14px', textAlign: 'center' }}>
                          ✓ Project is live
                        </div>
                      ) : (
                        <button
                          className={`${s.btn} ${s.btnPrimary}`}
                          disabled={!canPublish || publishing}
                          onClick={handlePublish}
                        >
                          {publishing ? 'Publishing…' : '↑ Publish'}
                        </button>
                      )}
                      <button
                        className={`${s.btn} ${s.btnGhost}`}
                        onClick={() => navigate(`/admin/projects/${id}/edit`)}
                      >
                        ← Back to edit
                      </button>
                    </div>

                    {!canPublish && !isPublished && (
                      <p className={s.actionNote}>
                        Fix the required checklist items above before publishing.
                      </p>
                    )}
                    {isPublished && (
                      <p className={s.actionNote}>
                        Your project is live. Go back to edit if you need to make changes.
                      </p>
                    )}

                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={pageStyles.bFoot}>
              <div className={pageStyles.footInfo}>
                preview · <span className={pageStyles.footStepName}>{project.slug}</span>
              </div>
              <div className={pageStyles.footBtns}>
                <button
                  className={`${pageStyles.btn} ${pageStyles.btnGhost}`}
                  onClick={() => navigate(`/admin/projects/${id}/edit`)}
                >
                  ← Back to edit
                </button>
                {!isPublished && (
                  <button
                    className={`${pageStyles.btn} ${pageStyles.btnPrimary}`}
                    onClick={handlePublish}
                    disabled={!canPublish || publishing}
                  >
                    {publishing ? 'Publishing…' : '↑ Publish'}
                  </button>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
