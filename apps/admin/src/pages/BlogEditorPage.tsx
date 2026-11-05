import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import Sidebar from '../components/layout/Sidebar'
import BlogEditor from '../components/blog/editor/BlogEditor'
import { setEditorBridge } from '../components/blog/editor/editorBridge'
import type { MediaRequest } from '../components/blog/editor/editorBridge'
import MediaPickerModal from '../components/blog/MediaPickerModal'
import { EmbedModal, LinkModal, TableSizeModal } from '../components/blog/EditorModals'
import PublishBar from '../components/blog/PublishBar'
import { sendNewsletter } from '../api/portfolioApi'
import Rail from '../components/blog/Rail'
import HistoryDrawer from '../components/blog/HistoryDrawer'
import { clearImage, pickImage } from '../components/blog/coverActions'
import {
  BlogApiError,
  checkSlug,
  deletePost,
  discardChanges,
  getEditorConfig,
  getPost,
  publishPost,
  restoreRevision,
  saveRevision,
  schedulePost,
  unarchivePost,
  unpublishPost,
  unschedulePost,
} from '../api/blogApi'
import {
  clearBackup,
  readBackup,
  registerOnCreated,
  useBlogEditorStore,
} from '../store/blogEditorStore'
import type { LocalBackup } from '../store/blogEditorStore'
import type { PostDetail, SlugCheck } from '../types/blog'
import ui from '../components/blog/blogUi.module.css'
import s from './BlogEditorPage.module.css'
import '../styles/blogArticle.css'

// ── title block ──────────────────────────────────────────────────────────────

function TitleBlock() {
  const fields = useBlogEditorStore((x) => x.fields)
  const postId = useBlogEditorStore((x) => x.postId)
  const slugError = useBlogEditorStore((x) => x.slugError)
  const limits = useBlogEditorStore((x) => x.config?.limits)
  const setField = useBlogEditorStore((x) => x.setField)
  const [editingSlug, setEditingSlug] = useState(false)
  const [slugDraft, setSlugDraft] = useState('')
  const [check, setCheck] = useState<SlugCheck | null>(null)

  useEffect(() => {
    if (!editingSlug || !slugDraft.trim()) return
    const t = setTimeout(() => {
      checkSlug(slugDraft, postId).then(setCheck).catch(() => setCheck(null))
    }, 400)
    return () => clearTimeout(t)
  }, [editingSlug, slugDraft, postId])

  function commitSlug(value: string) {
    setEditingSlug(false)
    const v = value.trim()
    if (v && v !== fields.slug) setField('slug', v, 0)
  }

  const titleLen = fields.title.trim().length
  const [minTitle, maxTitle] = limits?.title ?? [10, 100]

  return (
    <div className={s.editorHead}>
      <textarea
        className={s.titleInput}
        rows={1}
        value={fields.title}
        maxLength={limits?.title_hard_max ?? 150}
        placeholder="Title…"
        aria-label="Post title"
        onChange={(e) => setField('title', e.target.value.replace(/\n/g, ' '))}
        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
        onInput={(e) => {
          const el = e.currentTarget
          el.style.height = 'auto'
          el.style.height = `${el.scrollHeight}px`
        }}
      />
      {titleLen > 0 && (titleLen < minTitle || titleLen > maxTitle) && (
        <div className={s.titleHint}>{titleLen} characters — titles publish at {minTitle}–{maxTitle}.</div>
      )}
      <input
        className={s.subtitleInput}
        value={fields.subtitle ?? ''}
        maxLength={limits?.subtitle_max ?? 200}
        placeholder="Subtitle (optional)…"
        aria-label="Subtitle"
        onChange={(e) => setField('subtitle', e.target.value || null)}
      />
      <div className={s.slugLine}>
        <span>/blog/</span>
        {editingSlug ? (
          <>
            <input
              className={s.slugInput}
              autoFocus
              value={slugDraft}
              onChange={(e) => setSlugDraft(e.target.value)}
              onBlur={(e) => commitSlug(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitSlug(slugDraft)
                if (e.key === 'Escape') setEditingSlug(false)
              }}
            />
            {check && slugDraft.trim() && (
              <span className={check.available ? s.slugOk : s.slugBad}>
                {check.available ? `✓ ${check.slug}` : `✗ ${check.reason}${check.suggested ? ` · try ${check.suggested}` : ''}`}
              </span>
            )}
          </>
        ) : (
          <>
            <span className={s.slugValue}>{fields.slug || 'set-from-title'}</span>
            <button type="button" className={s.editMark} onClick={() => { setSlugDraft(fields.slug); setEditingSlug(true) }}>
              ✎ edit
            </button>
            {fields.slug_locked && (
              <button type="button" className={s.editMark} title="Follow the title again (drafts only)"
                onClick={() => setField('slug_locked', false, 0)}>
                ↺ auto
              </button>
            )}
          </>
        )}
      </div>
      {slugError && (
        <div className={s.slugError}>
          {slugError.message}
          {slugError.suggestion && (
            <button type="button" className={s.editMark} onClick={() => setField('slug', slugError.suggestion!, 0)}>
              use {slugError.suggestion}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function CoverZone() {
  const cover = useBlogEditorStore((x) => x.coverPreview)
  if (cover) {
    // c_limit only resizes — the whole cover is always shown, never cropped.
    const src = cover.url.includes('/upload/') ? cover.url.replace('/upload/', '/upload/f_auto,q_auto,w_1400,c_limit/') : cover.url
    return (
      <div className={s.coverSet}>
        <img src={src} alt={cover.alt ?? ''} />
        <div className={s.coverActs}>
          <button type="button" className={ui.btnSmall} onClick={() => pickImage('cover')}>Replace cover</button>
          <button type="button" className={ui.btnSmall} onClick={() => clearImage('cover')}>Remove</button>
        </div>
      </div>
    )
  }
  return (
    <button type="button" className={s.coverZone} onClick={() => pickImage('cover')}>
      <span className={s.cornerTag}>/// cover image</span>
      <span className={s.uglyph}>⬆</span>
      <span>Upload from your device, or <span className={s.ulink}>browse the Cloudinary library</span></span>
    </button>
  )
}

function WordFooter({ editor }: { editor: Editor | null }) {
  const stats = useBlogEditorStore((x) => x.stats)
  const lastSavedAt = useBlogEditorStore((x) => x.lastSavedAt)
  const live = useEditorState({
    editor,
    selector: (ctx) => ({
      words: ctx.editor?.storage.characterCount.words() ?? 0,
      blocks: ctx.editor?.state.doc.childCount ?? 0,
    }),
  })
  const words = live?.words ?? stats?.word_count ?? 0
  return (
    <div className={s.wordCount}>
      <span>~{words} words · {Math.max(1, Math.ceil(words / 230))} min read · {live?.blocks ?? stats?.block_count ?? 0} blocks</span>
      <span>{lastSavedAt ? `last saved · ${new Date(lastSavedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'not saved yet'}</span>
    </div>
  )
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function BlogEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const store = useBlogEditorStore
  const config = useBlogEditorStore((x) => x.config)
  const postId = useBlogEditorStore((x) => x.postId)
  const saveState = useBlogEditorStore((x) => x.saveState)
  const archived = useBlogEditorStore((x) => x.post?.status === 'archived')

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editorKey, setEditorKey] = useState(0)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<{ text: string; tone?: 'bad' } | null>(null)
  const [recovery, setRecovery] = useState<LocalBackup | null>(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [highlightChecklist, setHighlightChecklist] = useState(false)
  const [mediaRequest, setMediaRequest] = useState<{ n: number; req: MediaRequest } | null>(null)
  const [embedDone, setEmbedDone] = useState<((a: Record<string, unknown>) => void) | null>(null)
  const [tableDone, setTableDone] = useState<((r: number, c: number) => void) | null>(null)
  const [linkEditor, setLinkEditor] = useState<Editor | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Set when this page lazily created the post, so the /new → /:id/edit
  // navigation doesn't reload (and remount) the editor mid-sentence.
  const justCreated = useRef<string | null>(null)
  const title = useBlogEditorStore((x) => x.fields.title)

  const showToast = useCallback((text: string, tone?: 'bad') => {
    setToast({ text, tone })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 4500)
  }, [])

  // Modals the editor opens through the bridge.
  useEffect(() => {
    setEditorBridge({
      openMedia: (req) => setMediaRequest((cur) => ({ n: (cur?.n ?? 0) + 1, req })),
      openEmbed: (fn) => setEmbedDone(() => fn),
      openTable: (fn) => setTableDone(() => fn),
      openLink: (ed) => setLinkEditor(ed),
    })
    registerOnCreated((newId) => {
      justCreated.current = newId
      navigate(`/admin/blogs/${newId}/edit`, { replace: true })
    })
    return () => registerOnCreated(null)
  }, [navigate])

  // Load config + post. Going /new → /:id/edit after the lazy create keeps the
  // editor mounted (the store already holds that post).
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadError(null)
      try {
        if (!store.getState().config) store.getState().setConfig(await getEditorConfig())
        if (!id) {
          if (store.getState().postId) store.getState().reset()
          const backup = readBackup(null)
          setRecovery(backup && Object.keys(backup.fields).length ? backup : null)
          setEditorKey((k) => k + 1)
        } else if (justCreated.current !== id || store.getState().postId !== id) {
          const post = await getPost(id)
          if (cancelled) return
          store.getState().loadPost(post)
          const backup = readBackup(id)
          setRecovery(backup && backup.at > Date.parse(post.updated_at) && Object.keys(backup.fields).length ? backup : null)
          setEditorKey((k) => k + 1)
        }
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Could not load the post')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [id, store])

  // Never lose work on close / tab switch.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      const st = store.getState()
      if (Object.keys(st.pending).length || st.contentDirty || st.saveState === 'saving') {
        st.flushOnUnload()
        e.preventDefault()
      }
    }
    const onHide = () => {
      if (document.visibilityState === 'hidden') void store.getState().flush()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('visibilitychange', onHide)
      void store.getState().flush()
    }
  }, [store])

  // ── actions ────────────────────────────────────────────────────────────────

  const ensureSaved = useCallback(async () => {
    const ok = await store.getState().flush()
    const st = store.getState()
    if (!ok || !st.postId) {
      showToast(st.postId ? 'Save failed — fix the issue above first.' : 'Add a title or some text first.', 'bad')
      return null
    }
    return st
  }, [store, showToast])

  const handleApiError = useCallback((e: unknown, fallback: string) => {
    if (e instanceof BlogApiError) {
      if (e.code === 'CHECKLIST_FAILED') {
        const checklist = e.detail.checklist as PostDetail['checklist'] | undefined
        if (checklist) store.setState({ checklist })
        setHighlightChecklist(true)
        setTimeout(() => setHighlightChecklist(false), 2000)
        showToast('Some checklist items need fixing first.', 'bad')
        return
      }
      if (e.code === 'VERSION_CONFLICT') {
        store.setState({ saveState: 'conflict', conflictVersion: (e.detail.current_version as number) ?? null })
        return
      }
      showToast(e.message, 'bad')
      return
    }
    showToast(fallback, 'bad')
  }, [store, showToast])

  async function run(label: string, fn: (st: ReturnType<typeof store.getState>) => Promise<void>) {
    if (busy) return
    setBusy(label)
    try {
      const st = await ensureSaved()
      if (st) await fn(st)
    } catch (e) {
      handleApiError(e, `Could not ${label}.`)
    } finally {
      setBusy(null)
    }
  }

  function replaceEditorContent(detail: PostDetail) {
    store.getState().applyDetail(detail, { replaceFields: true })
    clearBackup(detail.id)
    setEditorKey((k) => k + 1)
  }

  const onPublish = () => run('publish', async (st) => {
    const warnings = st.checklist?.items.filter((i) => i.level === 'warning' && !i.passed) ?? []
    if (st.checklist?.can_publish && warnings.length) {
      const list = warnings.map((w) => `• ${w.label}${w.message ? ` — ${w.message}` : ''}`).join('\n')
      if (!window.confirm(`Publish with these suggestions open?\n\n${list}`)) return
    }
    const live = st.post?.status === 'published'
    const detail = await publishPost(st.postId!, st.version)
    st.applyDetail(detail)
    showToast(live ? 'Live post updated ✓' : 'Published ✓ — it’s live')
  })

  const onSchedule = (iso: string) => run('schedule', async (st) => {
    const detail = await schedulePost(st.postId!, st.version, iso)
    st.applyDetail(detail)
    setScheduleOpen(false)
    showToast(`Scheduled ✓ — ${detail.status_label.replace('Scheduled · ', '')}`)
  })

  const onUnschedule = () => run('unschedule', async (st) => {
    const detail = await unschedulePost(st.postId!, st.version)
    st.applyDetail(detail)
    setScheduleOpen(false)
    showToast('Unscheduled — back to draft')
  })

  const onUnpublish = () => run('unpublish', async (st) => {
    if (!window.confirm('Take this post offline? Its URL will stop working until you publish again.')) return
    st.applyDetail(await unpublishPost(st.postId!, st.version))
    showToast('Unpublished — the post is a draft again')
  })

  const onEmailSubscribers = () => run('email', async (st) => {
    if (!window.confirm('Email this post to all confirmed subscribers? This can only be done once per post.')) return
    const sent = await sendNewsletter(st.postId!, st.version)
    showToast(`Sending to ${sent.recipients} subscriber${sent.recipients === 1 ? '' : 's'}`)
  })

  const onDiscard = () => run('discard', async (st) => {
    if (!window.confirm('Discard your unpublished changes and go back to the live version? A safety copy is kept in History.')) return
    replaceEditorContent(await discardChanges(st.postId!, st.version))
    showToast('Changes discarded')
  })

  const onDelete = () => run('delete', async (st) => {
    if (!window.confirm('Delete this draft permanently? Images stay in the media library.')) return
    await deletePost(st.postId!, st.version)
    clearBackup(st.postId)
    st.reset()
    navigate('/admin/blogs', { replace: true })
  })

  const onSaveDraft = () => run('save draft', async (st) => {
    await saveRevision(st.postId!, store.getState().version)
    showToast('Draft saved ✓')
  })
  const saveDraftRef = useRef(onSaveDraft)
  useEffect(() => {
    saveDraftRef.current = onSaveDraft
  })

  const onRestore = (revisionId: string) => run('restore', async (st) => {
    replaceEditorContent(await restoreRevision(st.postId!, revisionId, st.version))
    setHistoryOpen(false)
    showToast('Version restored — press Update to make it live')
  })

  const onPreview = async () => {
    const st = await ensureSaved()
    if (st) window.open(`/admin/blogs/${st.postId}/preview`, '_blank', 'noopener')
  }

  // Ctrl/⌘+S = Save draft (a named version), not the browser's save dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void saveDraftRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Archived posts are read-only (server: POST_ARCHIVED) until restored.
  async function onRestoreFromArchive() {
    const st = store.getState()
    if (!st.postId || busy) return
    setBusy('restore')
    try {
      const post = await unarchivePost(st.postId, st.version)
      st.loadPost(post)
      setEditorKey((k) => k + 1)
      showToast('Restored to drafts — you can edit again')
    } catch (e) {
      handleApiError(e, 'Could not restore the post')
    } finally {
      setBusy(null)
    }
  }

  async function reloadFromServer() {
    const st = store.getState()
    if (!st.postId) return
    const post = await getPost(st.postId)
    st.loadPost(post)
    clearBackup(post.id)
    setEditorKey((k) => k + 1)
  }

  function applyRecovery() {
    if (!recovery) return
    const st = store.getState()
    const { content, ...rest } = recovery.fields
    for (const [k, v] of Object.entries(rest)) st.setField(k as keyof typeof rest, v as never)
    if (content) {
      store.setState((x) => ({ fields: { ...x.fields, content } }))
      setEditorKey((k) => k + 1)
      st.markContentDirty()
    }
    setRecovery(null)
    showToast('Unsaved changes recovered')
  }

  const isNew = !id

  return (
    <div className={s.page}>
      {toast && <div className={`${s.toast}${toast.tone === 'bad' ? ` ${s.toastBad}` : ''}`} role="status">{toast.text}</div>}

      <header className={s.pagehead}>
        <div>
          <h1>{isNew && !postId ? 'New Post' : 'Edit Post'} <span className={s.scribble}>/ Editor</span></h1>
          <nav className={s.crumbs}>
            <a href="/dashboard">Dashboard</a> › <a href="/admin/blogs">Blogs</a> ›
            <span className={s.crumbCur}>{title || (isNew ? 'New post' : 'Post')}</span>
          </nav>
        </div>
        <div className={s.meta}>
          Spec § 5.3<br />
          rich editor · SEO · schedule
        </div>
      </header>

      <div className={s.layout}>
        <Sidebar activeItem="Blogs" />

        <main className={s.main}>
          {loadError ? (
            <div className={ui.error}>
              {loadError} <button type="button" className={ui.btnSmall} onClick={() => navigate('/admin/blogs')}>Back to blogs</button>
            </div>
          ) : loading || !config ? (
            <div className={ui.note}>Loading editor…</div>
          ) : (
            <>
              {archived && (
                <div className={s.banner}>
                  <b>This post is archived.</b>
                  <span>It's read-only and not on the site. Restore it to drafts to edit or publish it again.</span>
                  <button type="button" className={ui.btnSmall} disabled={busy !== null}
                    onClick={() => void onRestoreFromArchive()}>↺ Restore to drafts</button>
                </div>
              )}
              <div inert={archived} className={archived ? s.readOnly : undefined}>
              <PublishBar
                busy={busy}
                scheduleOpen={scheduleOpen}
                setScheduleOpen={setScheduleOpen}
                onPreview={() => void onPreview()}
                onHistory={() => setHistoryOpen(true)}
                onSaveDraft={() => void onSaveDraft()}
                onPublish={() => void onPublish()}
                onSchedule={(iso) => void onSchedule(iso)}
                onUnschedule={() => void onUnschedule()}
                onUnpublish={() => void onUnpublish()}
                onDiscard={() => void onDiscard()}
                onEmail={() => void onEmailSubscribers()}
                onDelete={() => void onDelete()}
              />

              {saveState === 'conflict' && (
                <div className={s.banner}>
                  <b>This post was changed in another tab or window.</b>
                  <span>Reload to get the latest version, or keep yours and overwrite it.</span>
                  <button type="button" className={ui.btnSmall} onClick={() => void reloadFromServer()}>Reload</button>
                  <button type="button" className={ui.btnSmall} onClick={() => void store.getState().keepMine()}>Keep mine</button>
                </div>
              )}
              {recovery && (
                <div className={s.banner}>
                  <b>Unsaved changes found</b>
                  <span>from {new Date(recovery.at).toLocaleString()} — they never reached the server.</span>
                  <button type="button" className={ui.btnSmall} onClick={applyRecovery}>Recover</button>
                  <button type="button" className={ui.btnSmall} onClick={() => { clearBackup(postId); setRecovery(null) }}>Discard</button>
                </div>
              )}

              <div className={s.editorLayout}>
                <div className={`${s.editor} wobble`}>
                  <TitleBlock />
                  <CoverZone />
                  <BlogEditor key={editorKey} initialContent={store.getState().fields.content} onReady={setEditor} />
                  <WordFooter editor={editor} />
                </div>
                <Rail onOpenSchedule={() => setScheduleOpen(true)} highlightChecklist={highlightChecklist} />
              </div>
              </div>
            </>
          )}
        </main>
      </div>

      {mediaRequest && (
        <MediaPickerModal
          key={mediaRequest.n}
          request={mediaRequest.req}
          folders={config?.media_folders ?? {}}
          coverMinWidth={config?.upload.cover_min_width ?? 1200}
          onClose={() => setMediaRequest(null)}
        />
      )}
      {embedDone && (
        <EmbedModal providers={config?.embed_providers ?? []} onDone={embedDone} onClose={() => setEmbedDone(null)} />
      )}
      {tableDone && (
        <TableSizeModal
          maxRows={config?.limits.table_max_rows ?? 200}
          maxCols={config?.limits.table_max_cols ?? 20}
          onDone={tableDone}
          onClose={() => setTableDone(null)}
        />
      )}
      {linkEditor && <LinkModal editor={linkEditor} onClose={() => setLinkEditor(null)} />}
      {historyOpen && postId && (
        <HistoryDrawer
          postId={postId}
          timeZone={config?.timezone ?? 'Asia/Kolkata'}
          onRestore={(rid) => void onRestore(rid)}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </div>
  )
}
