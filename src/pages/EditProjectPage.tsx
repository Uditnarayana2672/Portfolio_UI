import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import BlockEditorDrawer from '../components/newProject/BlockEditorDrawer'
import type { DrawerState } from '../components/newProject/BlockEditorDrawer'
import {
  BLOCK_TYPES,
  TYPE_BY_ID,
  defaultEditorData,
  previewText,
} from '../components/project/blocks/blockTypes'
import type { BlockId } from '../components/project/blocks/blockTypes'
import {
  getProject,
  updateProject,
  addProjectBlock,
  updateBlock,
  deleteBlock,
  reorderProjectBlocks,
  fromBackendConfig,
  type ProjectDetail,
  type UpdateProjectPayload,
} from '../api/projectApi'
import pageStyles from './NewProjectPage.module.css'
import blockStyles from '../components/newProject/Step3Blocks.module.css'

// ── Types ─────────────────────────────────────────────────────────────────────

interface EditableBlock {
  id: string
  typeId: BlockId
  position: number
  config: Record<string, unknown>
}

// ── Shared UI helpers ─────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontFamily: 'Patrick Hand, sans-serif',
  fontSize: 16,
  border: '1.5px solid var(--ink)',
  background: 'var(--paper)',
  padding: '7px 10px',
  color: 'var(--ink)',
  boxSizing: 'border-box',
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '2px',
      color: 'var(--accent)',
      borderBottom: '1.5px solid var(--ink-faint)',
      paddingBottom: 6,
      marginBottom: 16,
    }}>
      {children}
    </div>
  )
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px 20px' }}>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        color: 'var(--ink-soft)',
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // ── Remote state ────────────────────────────────────────────────────────────
  const [project, setProject]     = useState<ProjectDetail | null>(null)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [toast, setToast]         = useState<string | null>(null)
  const toastTimer                = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Metadata form fields ─────────────────────────────────────────────────────
  const [title, setTitle]               = useState('')
  const [slug, setSlug]                 = useState('')
  const [excerpt, setExcerpt]           = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [templateId, setTemplateId]     = useState('narrative')
  const [status, setStatus]             = useState('draft')
  const [visibility, setVisibility]     = useState('public')
  const [isFeatured, setIsFeatured]     = useState(false)
  const [techStack, setTechStack]       = useState('')
  const [githubUrl, setGithubUrl]       = useState('')
  const [demoUrl, setDemoUrl]           = useState('')
  const [metaTitle, setMetaTitle]       = useState('')
  const [metaDesc, setMetaDesc]         = useState('')
  const [ogImage, setOgImage]           = useState('')
  const [canonical, setCanonical]       = useState('')

  // ── Public-page header fields (flat columns) ─────────────────────────────────
  const [category, setCategory]             = useState('')
  const [role, setRole]                     = useState('')
  const [projectTimeline, setProjectTimeline] = useState('')
  const [displayStatus, setDisplayStatus]   = useState('')
  const [recognition, setRecognition]       = useState('')

  // ── Blocks state ─────────────────────────────────────────────────────────────
  const [blocks, setBlocks]             = useState<EditableBlock[]>([])
  const [pickerOpen, setPickerOpen]     = useState(false)
  const [drawerState, setDrawerState]   = useState<DrawerState | null>(null)
  const [draggingIdx, setDraggingIdx]   = useState(-1)
  const [dragOverIdx, setDragOverIdx]   = useState(-1)
  const dragSrcIdx                      = useRef(-1)

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function showToast(msg: string) {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  function projectToBlocks(p: ProjectDetail): EditableBlock[] {
    return p.blocks
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(b => ({
        id:       b.id,
        typeId:   b.block_type as BlockId,
        position: b.position,
        config:   b.config,
      }))
  }

  // ── Load project ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getProject(id)
      .then(p => {
        setProject(p)
        setTitle(p.title)
        setSlug(p.slug)
        setExcerpt(p.excerpt ?? '')
        setThumbnailUrl(p.thumbnail_url ?? '')
        setTemplateId(p.template_id)
        setStatus(p.status)
        setVisibility(p.visibility)
        setIsFeatured(p.is_featured)
        setTechStack(p.tech_stack.join(', '))
        setGithubUrl(p.github_url ?? '')
        setDemoUrl(p.demo_url ?? '')
        setMetaTitle(p.seo.meta_title ?? '')
        setMetaDesc(p.seo.meta_description ?? '')
        setOgImage(p.seo.og_image_url ?? '')
        setCanonical(p.seo.canonical_url ?? '')
        setCategory(p.category ?? '')
        setRole(p.role ?? '')
        setProjectTimeline(p.project_timeline ?? '')
        setDisplayStatus(p.display_status ?? '')
        setRecognition(p.recognition ?? '')
        setBlocks(projectToBlocks(p))
      })
      .catch(e => setLoadError(e instanceof Error ? e.message : 'Failed to load project'))
      .finally(() => setLoading(false))
  }, [id])

  // ── Save metadata ─────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!id || !title.trim()) return
    setSaving(true)
    const payload: UpdateProjectPayload = {
      title:         title.trim(),
      slug:          slug.trim() || undefined,
      excerpt:       excerpt.trim() || null,
      thumbnail_url: thumbnailUrl.trim() || null,
      template_id:   templateId,
      status,
      visibility,
      is_featured:   isFeatured,
      tech_stack:    techStack.split(',').map(t => t.trim()).filter(Boolean),
      github_url:    githubUrl.trim() || null,
      demo_url:      demoUrl.trim() || null,
      seo: {
        meta_title:       metaTitle.trim() || null,
        meta_description: metaDesc.trim() || null,
        og_image_url:     ogImage.trim() || null,
        canonical_url:    canonical.trim() || null,
      },
      category:         category.trim() || null,
      role:             role.trim() || null,
      project_timeline: projectTimeline.trim() || null,
      display_status:   displayStatus.trim() || null,
      recognition:      recognition.trim() || null,
    }
    try {
      await updateProject(id, payload)
      showToast('Project saved.')
      navigate('/admin/projects')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  // ── Block actions ─────────────────────────────────────────────────────────────

  function openAddDrawer(typeId: BlockId) {
    setPickerOpen(false)
    setDrawerState({ mode: 'add', typeId, blockId: null, data: defaultEditorData(typeId) })
  }

  function openEditDrawer(block: EditableBlock) {
    setDrawerState({
      mode:    'edit',
      typeId:  block.typeId,
      blockId: block.id,
      data:    fromBackendConfig(block.typeId, block.config),
    })
  }

  async function handleDrawerSave(
    typeId: BlockId,
    blockId: string | null,
    data: Record<string, unknown>,
  ) {
    if (!id) return
    if (blockId) {
      try {
        await updateBlock(id, blockId, typeId, data)
        // Refresh block config in local state without a full reload
        setBlocks(prev => prev.map(b => {
          if (b.id !== blockId) return b
          // Store the new frontend data as-is; fromBackendConfig will re-convert on next open
          return { ...b, config: data as Record<string, unknown> }
        }))
        showToast('Block updated.')
      } catch (e) {
        showToast(e instanceof Error ? e.message : 'Block update failed')
      }
    } else {
      try {
        await addProjectBlock(id, { type_id: typeId, data }, blocks.length)
        // Re-fetch to get the real block ID assigned by the backend
        const updated = await getProject(id)
        setBlocks(projectToBlocks(updated))
        showToast('Block added.')
      } catch (e) {
        showToast(e instanceof Error ? e.message : 'Block add failed')
      }
    }
    setDrawerState(null)
  }

  async function handleDeleteBlock(blockId: string) {
    if (!id || !confirm('Delete this block?')) return
    try {
      await deleteBlock(id, blockId)
      setBlocks(prev => prev.filter(b => b.id !== blockId))
      showToast('Block deleted.')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  // ── Drag-and-drop ─────────────────────────────────────────────────────────────

  function handleDragStart(idx: number) {
    dragSrcIdx.current = idx
    setDraggingIdx(idx)
  }

  function handleDragEnd() {
    setDraggingIdx(-1)
    setDragOverIdx(-1)
    dragSrcIdx.current = -1
  }

  async function handleDrop(idx: number) {
    const src = dragSrcIdx.current
    setDragOverIdx(-1)
    if (src === -1 || src === idx) return
    const next = [...blocks]
    const [moved] = next.splice(src, 1)
    next.splice(idx, 0, moved)
    setBlocks(next)
    if (!id) return
    try {
      await reorderProjectBlocks(id, next.map(b => b.id))
      showToast('Blocks reordered.')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Reorder failed')
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ padding: 60, fontFamily: 'Caveat, cursive', fontSize: 28, color: 'var(--ink-soft)' }}>
        Loading project…
      </div>
    )
  }

  if (loadError) {
    return (
      <div style={{ padding: 60, fontFamily: 'Patrick Hand, sans-serif', color: 'var(--accent)', fontSize: 18 }}>
        {loadError}
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

  const techChips = techStack.split(',').map(t => t.trim()).filter(Boolean)

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
          <h1>Edit Project <span className={pageStyles.scribble}>/ {project?.title}</span></h1>
          <nav className={pageStyles.crumbs}>
            <a href="/dashboard">Dashboard</a>{' › '}
            <a href="/admin/projects">Projects</a>{' › '}
            <span className={pageStyles.crumbCur}>Edit</span>
          </nav>
        </div>
      </header>

      <div className={pageStyles.layout}>
        <Sidebar activeItem="Projects" />

        <main className={pageStyles.main}>
          <div className={`${pageStyles.builder} wobble`}>

            {/* Top bar */}
            <div className={pageStyles.bTop}>
              <div className={pageStyles.bCrumb}>
                <Link to="/admin/projects" className={pageStyles.bCrumbBack}>← Projects</Link>
                <span className={pageStyles.bCrumbArrow}>/</span>
                <span className={pageStyles.bCrumbCur}>{project?.title ?? 'Edit'}</span>
              </div>
              <div className={pageStyles.topActs}>
                <button
                  className={`${pageStyles.btn} ${pageStyles.btnGhost}`}
                  onClick={() => navigate('/admin/projects')}
                >
                  Cancel
                </button>
                <button
                  className={`${pageStyles.btn} ${pageStyles.btnGhost}`}
                  onClick={() => navigate(`/admin/projects/${id}/preview`)}
                >
                  ⌕ Preview
                </button>
                <button
                  className={`${pageStyles.btn} ${pageStyles.btnPrimary}`}
                  onClick={handleSave}
                  disabled={saving || !title.trim()}
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>

            {/* Body */}
            <div className={pageStyles.bBody}>
              <form
                onSubmit={e => { e.preventDefault(); handleSave() }}
                style={{ display: 'flex', flexDirection: 'column', gap: 32 }}
              >

                {/* ── Core fields ── */}
                <section>
                  <SectionLabel>Core fields</SectionLabel>
                  <FieldGrid>
                    <Field label="Title *">
                      <input type="text" value={title} onChange={e => setTitle(e.target.value)} required style={inputStyle} />
                    </Field>
                    <Field label="Slug">
                      <input type="text" value={slug} onChange={e => setSlug(e.target.value)} style={inputStyle} placeholder="auto-generated if blank" />
                    </Field>
                    <Field label="Template">
                      <select value={templateId} onChange={e => setTemplateId(e.target.value)} style={inputStyle}>
                        <option value="narrative">Narrative</option>
                        <option value="case-study">Technical</option>
                        <option value="gallery">Visual</option>
                        <option value="minimal">Minimal</option>
                        <option value="interactive">Interactive</option>
                      </select>
                    </Field>
                    <Field label="Status">
                      <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </Field>
                    <Field label="Visibility">
                      <select value={visibility} onChange={e => setVisibility(e.target.value)} style={inputStyle}>
                        <option value="public">Public</option>
                        <option value="members_only">Members only</option>
                        <option value="unlisted">Unlisted</option>
                      </select>
                    </Field>
                    <Field label="Featured">
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Patrick Hand, sans-serif', fontSize: 17, cursor: 'pointer', paddingTop: 4 }}>
                        <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                        Pin to featured section
                      </label>
                    </Field>
                  </FieldGrid>
                  <div style={{ marginTop: 16 }}>
                    <Field label="Excerpt">
                      <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Short project summary" />
                    </Field>
                  </div>
                </section>

                {/* ── Links & assets ── */}
                <section>
                  <SectionLabel>Links & assets</SectionLabel>
                  <FieldGrid>
                    <Field label="GitHub URL">
                      <input type="text" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} style={inputStyle} placeholder="https://github.com/…" />
                    </Field>
                    <Field label="Demo URL">
                      <input type="text" value={demoUrl} onChange={e => setDemoUrl(e.target.value)} style={inputStyle} placeholder="https://…" />
                    </Field>
                    <Field label="Thumbnail URL">
                      <input type="text" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} style={inputStyle} placeholder="https://…" />
                    </Field>
                  </FieldGrid>
                </section>

                {/* ── Tech stack ── */}
                <section>
                  <SectionLabel>Tech stack</SectionLabel>
                  <Field label="Technologies (comma-separated)">
                    <input type="text" value={techStack} onChange={e => setTechStack(e.target.value)} style={inputStyle} placeholder="React, TypeScript, FastAPI, …" />
                  </Field>
                  {techChips.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                      {techChips.map(t => (
                        <span key={t} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, background: 'var(--paper-dark)', border: '1.5px solid var(--ink-faint)', padding: '2px 8px', color: 'var(--ink)' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </section>

                {/* ── Public page header ── */}
                <section>
                  <SectionLabel>Public page header</SectionLabel>
                  <p style={{ fontFamily: 'Patrick Hand, sans-serif', fontSize: 14, color: 'var(--ink-soft)', margin: '0 0 14px' }}>
                    The editorial masthead on the public project page — kicker, plus the Role / Timeline /
                    Status / Recognition meta grid. All optional. Add a "&nbsp;·&nbsp;" to fold in a
                    secondary detail, e.g. <i>Live in production · v2.1</i>.
                  </p>
                  <FieldGrid>
                    <Field label="Category / kicker">
                      <input type="text" value={category} onChange={e => setCategory(e.target.value)} style={inputStyle} placeholder="AI & Agents" />
                    </Field>
                    <Field label="Role">
                      <input type="text" value={role} onChange={e => setRole(e.target.value)} style={inputStyle} placeholder="Solo — design & build · end to end" />
                    </Field>
                    <Field label="Timeline">
                      <input type="text" value={projectTimeline} onChange={e => setProjectTimeline(e.target.value)} style={inputStyle} placeholder="Mar – Jun 2025 · ~10 weeks" />
                    </Field>
                    <Field label="Status">
                      <input type="text" value={displayStatus} onChange={e => setDisplayStatus(e.target.value)} style={inputStyle} placeholder="Live in production · v2.1" />
                    </Field>
                  </FieldGrid>
                  <div style={{ marginTop: 16 }}>
                    <Field label="Recognition">
                      <input type="text" value={recognition} onChange={e => setRecognition(e.target.value)} style={inputStyle} placeholder="Featured project · 12k+ conversations served" />
                    </Field>
                  </div>
                </section>

                {/* ── SEO ── */}
                <section>
                  <SectionLabel>SEO metadata</SectionLabel>
                  <FieldGrid>
                    <Field label="Meta title">
                      <input type="text" value={metaTitle} onChange={e => setMetaTitle(e.target.value)} style={inputStyle} maxLength={80} />
                    </Field>
                    <Field label="OG image URL">
                      <input type="text" value={ogImage} onChange={e => setOgImage(e.target.value)} style={inputStyle} />
                    </Field>
                  </FieldGrid>
                  <div style={{ marginTop: 16 }}>
                    <Field label="Meta description">
                      <textarea value={metaDesc} onChange={e => setMetaDesc(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} maxLength={200} />
                    </Field>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <Field label="Canonical URL">
                      <input type="text" value={canonical} onChange={e => setCanonical(e.target.value)} style={inputStyle} />
                    </Field>
                  </div>
                </section>

                {/* ── Content blocks ── */}
                <section>
                  <SectionLabel>Content blocks</SectionLabel>

                  <div className={blockStyles.blocksHead}>
                    <span className={blockStyles.blocksTitle}>Page content</span>
                    <span className={blockStyles.count}>
                      {blocks.length} BLOCK{blocks.length !== 1 ? 'S' : ''} · saved immediately on edit
                    </span>
                  </div>

                  <div className={blockStyles.blockList}>
                    {blocks.length === 0 && (
                      <div className={blockStyles.emptyList}>no blocks yet — add one below ↓</div>
                    )}
                    {blocks.map((block, idx) => {
                      const type = TYPE_BY_ID[block.typeId]
                      const preview = previewText(block.typeId, fromBackendConfig(block.typeId, block.config))
                      const isDragging = draggingIdx === idx
                      const isOver = dragOverIdx === idx && draggingIdx !== idx
                      return (
                        <div
                          key={block.id}
                          className={[
                            blockStyles.blockRow,
                            isDragging ? blockStyles.blockRowDragging : '',
                            isOver     ? blockStyles.blockRowOver     : '',
                          ].join(' ')}
                          draggable
                          onDragStart={() => handleDragStart(idx)}
                          onDragEnd={handleDragEnd}
                          onDragOver={e => { e.preventDefault(); setDragOverIdx(idx) }}
                          onDragLeave={() => setDragOverIdx(-1)}
                          onDrop={() => handleDrop(idx)}
                        >
                          <span className={blockStyles.dragH} title="Drag to reorder">⋮⋮</span>
                          <div className={blockStyles.blockIcon}>{type?.icon ?? '?'}</div>
                          <div className={blockStyles.blockMeta}>
                            <div className={blockStyles.blockType}>{type?.label ?? block.typeId}</div>
                            <div className={blockStyles.blockPrev}>{preview}</div>
                          </div>
                          <div className={blockStyles.blockActs}>
                            <button
                              type="button"
                              className={blockStyles.bact}
                              title="Edit block"
                              onClick={() => openEditDrawer(block)}
                            >✎</button>
                            <button
                              type="button"
                              className={`${blockStyles.bact} ${blockStyles.bactDanger}`}
                              title="Delete block"
                              onClick={() => handleDeleteBlock(block.id)}
                            >✕</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Add block button + picker */}
                  <button
                    type="button"
                    className={`${blockStyles.addBlockBtn} ${pickerOpen ? blockStyles.addBlockBtnOpen : ''}`}
                    onClick={() => setPickerOpen(o => !o)}
                  >
                    {pickerOpen ? '▲ close picker' : '+ add block'}
                  </button>

                  {pickerOpen && (
                    <div className={blockStyles.picker}>
                      {BLOCK_TYPES.map(type => (
                        <div
                          key={type.id}
                          className={blockStyles.pickerOpt}
                          role="button"
                          tabIndex={0}
                          onClick={() => openAddDrawer(type.id)}
                          onKeyDown={e => e.key === 'Enter' && openAddDrawer(type.id)}
                        >
                          <span className={blockStyles.pi}>{type.icon}</span>
                          <span className={blockStyles.pl}>{type.pickerLabel}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

              </form>
            </div>

            {/* Footer */}
            <div className={pageStyles.bFoot}>
              <div className={pageStyles.footInfo}>
                editing · <span className={pageStyles.footStepName}>{project?.slug}</span>
              </div>
              <div className={pageStyles.footBtns}>
                <button className={`${pageStyles.btn} ${pageStyles.btnGhost}`} onClick={() => navigate('/admin/projects')}>
                  Cancel
                </button>
                <button
                  className={`${pageStyles.btn} ${pageStyles.btnPrimary}`}
                  onClick={handleSave}
                  disabled={saving || !title.trim()}
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Block editor drawer — renders via portal at document.body */}
      <BlockEditorDrawer
        state={drawerState}
        onClose={() => setDrawerState(null)}
        onSave={handleDrawerSave}
      />
    </div>
  )
}
