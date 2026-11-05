import { create } from 'zustand'
import {
  BlogApiError,
  createPost,
  updatePost,
  updatePostKeepalive,
} from '../api/blogApi'
import type {
  Checklist,
  EditorConfig,
  PostDetail,
  PostStats,
  PostWritable,
  SeoFields,
  TipTapDoc,
} from '../types/blog'

// ── Autosave rules (Plan §3.13) ─────────────────────────────────────────────
// • save right after Enter (a block was finished), 1.5 s after typing stops,
//   on blur/tab hide, and at least every 30 s while typing continues
// • one request in flight; edits made meanwhile merge into the next one
// • network failures retry with backoff 2 s → 4 s → 8 s → 30 s
// • unsaved edits are mirrored to localStorage so a crash can't lose them

export const IDLE_DELAY_MS = 1500
export const ENTER_DELAY_MS = 120
const MAX_WAIT_MS = 30_000
const BACKOFF_MS = [2000, 4000, 8000, 30_000]

export type SaveState = 'idle' | 'saving' | 'saved' | 'offline' | 'conflict' | 'error'

export const EMPTY_DOC: TipTapDoc = { type: 'doc', content: [{ type: 'paragraph' }] }

export function emptyFields(): PostWritable {
  return {
    title: '',
    subtitle: null,
    slug: '',
    slug_locked: false,
    content: EMPTY_DOC,
    excerpt: null,
    cover_asset_id: null,
    og_asset_id: null,
    category_id: null,
    tags: [],
    allow_comments: true,
    seo: { meta_title: null, meta_description: null, canonical_url: null },
  }
}

function fieldsFrom(post: PostDetail): PostWritable {
  return {
    title: post.title,
    subtitle: post.subtitle,
    slug: post.slug,
    slug_locked: post.slug_locked,
    content: post.content?.content?.length ? post.content : EMPTY_DOC,
    excerpt: post.excerpt,
    cover_asset_id: post.cover?.id ?? null,
    og_asset_id: post.og_image?.id ?? null,
    category_id: post.category?.id ?? null,
    tags: post.tags,
    allow_comments: post.allow_comments,
    seo: { ...post.seo },
  }
}

function hasText(node: { text?: string; type?: string; content?: unknown[] } | undefined): boolean {
  if (!node) return false
  if (node.type === 'text' && node.text?.trim()) return true
  if (['image', 'imageGallery', 'video', 'embed'].includes(node.type ?? '')) return true
  return (node.content as typeof node[] | undefined)?.some(hasText) ?? false
}

const backupKey = (id: string | null) => `blog-draft:${id ?? 'new'}`

export interface MediaPreview {
  url: string
  alt: string | null
  width: number | null
}

function previewOf(m: PostDetail['cover']): MediaPreview | null {
  return m?.url ? { url: m.url, alt: m.alt_text, width: m.width } : null
}

export interface LocalBackup {
  at: number
  version: number
  fields: Partial<PostWritable>
}

export function readBackup(id: string | null): LocalBackup | null {
  try {
    const raw = localStorage.getItem(backupKey(id))
    return raw ? (JSON.parse(raw) as LocalBackup) : null
  } catch {
    return null
  }
}

export function clearBackup(id: string | null) {
  try {
    localStorage.removeItem(backupKey(id))
  } catch {
    /* storage unavailable */
  }
}

interface BlogEditorState {
  config: EditorConfig | null
  postId: string | null
  version: number
  post: PostDetail | null
  fields: PostWritable
  pending: Partial<PostWritable>
  contentDirty: boolean
  saveState: SaveState
  saveError: string | null
  lastSavedAt: number | null
  checklist: Checklist | null
  stats: PostStats | null
  hasUnpublishedChanges: boolean
  conflictVersion: number | null
  slugError: { message: string; suggestion: string | null } | null
  warnings: { code: string; message: string }[]
  coverPreview: MediaPreview | null
  ogPreview: MediaPreview | null

  setPreview: (kind: 'cover' | 'og', preview: MediaPreview | null) => void
  setConfig: (config: EditorConfig) => void
  reset: () => void
  loadPost: (post: PostDetail) => void
  applyDetail: (post: PostDetail, opts?: { replaceFields?: boolean }) => void
  setField: <K extends keyof PostWritable>(key: K, value: PostWritable[K], delayMs?: number) => void
  setSeo: (patch: Partial<SeoFields>) => void
  markContentDirty: (delayMs?: number) => void
  flush: () => Promise<boolean>
  keepMine: () => Promise<boolean>
  flushOnUnload: () => void
}

// Module-level plumbing the store's actions share.
let saveTimer: ReturnType<typeof setTimeout> | null = null
let firstDirtyAt: number | null = null
let inFlight: Promise<boolean> | null = null
let queued = false
let retryIndex = 0
let contentGetter: (() => TipTapDoc) | null = null
let onCreated: ((id: string) => void) | null = null
let idempotencyKey = crypto.randomUUID()

export function registerContentGetter(fn: (() => TipTapDoc) | null) {
  contentGetter = fn
}

/** The editor's live document (falls back to the last loaded one). */
export function currentContent(): TipTapDoc {
  return contentGetter ? contentGetter() : useBlogEditorStore.getState().fields.content
}

export function registerOnCreated(fn: ((id: string) => void) | null) {
  onCreated = fn
}

export const useBlogEditorStore = create<BlogEditorState>((set, get) => {
  function writeBackup() {
    const s = get()
    const fields: Partial<PostWritable> = { ...s.pending }
    if (s.contentDirty && contentGetter) fields.content = contentGetter()
    try {
      localStorage.setItem(backupKey(s.postId), JSON.stringify({ at: Date.now(), version: s.version, fields }))
    } catch {
      /* storage full or blocked — the in-memory queue still holds it */
    }
  }

  function schedule(delayMs: number) {
    const now = Date.now()
    firstDirtyAt ??= now
    // Never let continuous typing postpone a save past MAX_WAIT_MS.
    const wait = Math.max(0, Math.min(delayMs, firstDirtyAt + MAX_WAIT_MS - now))
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => void get().flush(), wait)
    writeBackup()
  }

  async function runSave(): Promise<boolean> {
    const s = get()
    const changes: Partial<PostWritable> = { ...s.pending }
    const sendsContent = s.contentDirty && !!contentGetter
    if (sendsContent) changes.content = contentGetter!()
    if (!Object.keys(changes).length) return true

    // Lazy create: nothing hits the server until there's a title or some text.
    if (!s.postId) {
      const merged = { ...s.fields, ...changes }
      if (!merged.title.trim() && !hasText(merged.content)) return true
    }

    set({ pending: {}, contentDirty: false, saveState: 'saving', saveError: null })
    firstDirtyAt = null

    try {
      if (!s.postId) {
        const body = { ...s.fields, ...changes }
        const detail = await createPost(body, idempotencyKey)
        clearBackup(null)
        set((st) => ({
          postId: detail.id,
          version: detail.version,
          post: detail,
          checklist: detail.checklist,
          stats: detail.stats,
          hasUnpublishedChanges: detail.has_unpublished_changes,
          fields: { ...st.fields, slug: detail.slug },
          saveState: 'saved',
          lastSavedAt: Date.now(),
        }))
        onCreated?.(detail.id)
      } else {
        const res = await updatePost(s.postId, s.version, changes)
        set((st) => ({
          version: res.version,
          checklist: res.checklist,
          stats: res.stats,
          hasUnpublishedChanges: res.has_unpublished_changes,
          fields: { ...st.fields, slug: res.slug },
          warnings: res.warnings,
          saveState: 'saved',
          lastSavedAt: Date.now(),
          slugError: 'slug' in changes ? null : st.slugError,
        }))
      }
      retryIndex = 0
      const after = get()
      if (!Object.keys(after.pending).length && !after.contentDirty) clearBackup(after.postId)
      return true
    } catch (err) {
      const e = err instanceof BlogApiError ? err : new BlogApiError(0, 'NETWORK', String(err))
      // Put the unsent changes back under anything typed since.
      const keep: Partial<PostWritable> = { ...changes }
      delete keep.content
      if (e.code === 'SLUG_TAKEN' || e.code === 'RESERVED_SLUG') {
        delete keep.slug
        set({
          slugError: {
            message: e.message,
            suggestion: (e.detail.suggestion as string | undefined) ?? null,
          },
        })
      }
      set((st) => ({
        pending: { ...keep, ...st.pending },
        contentDirty: st.contentDirty || sendsContent,
      }))

      if (e.code === 'VERSION_CONFLICT') {
        set({ saveState: 'conflict', conflictVersion: (e.detail.current_version as number) ?? null })
      } else if (e.status === 0 || e.status >= 500 || e.status === 429) {
        const delay = BACKOFF_MS[Math.min(retryIndex, BACKOFF_MS.length - 1)]
        retryIndex += 1
        set({ saveState: 'offline', saveError: e.message })
        if (saveTimer) clearTimeout(saveTimer)
        saveTimer = setTimeout(() => void get().flush(), delay)
      } else {
        set({ saveState: 'error', saveError: e.message })
      }
      writeBackup()
      return false
    }
  }

  return {
    config: null,
    postId: null,
    version: 0,
    post: null,
    fields: emptyFields(),
    pending: {},
    contentDirty: false,
    saveState: 'idle',
    saveError: null,
    lastSavedAt: null,
    checklist: null,
    stats: null,
    hasUnpublishedChanges: false,
    conflictVersion: null,
    slugError: null,
    warnings: [],
    coverPreview: null,
    ogPreview: null,

    setPreview: (kind, preview) => set(kind === 'cover' ? { coverPreview: preview } : { ogPreview: preview }),
    setConfig: (config) => set({ config }),

    reset: () => {
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = null
      firstDirtyAt = null
      retryIndex = 0
      idempotencyKey = crypto.randomUUID()
      set({
        postId: null, version: 0, post: null, fields: emptyFields(), pending: {},
        contentDirty: false, saveState: 'idle', saveError: null, lastSavedAt: null,
        checklist: null, stats: null, hasUnpublishedChanges: false, conflictVersion: null,
        slugError: null, warnings: [], coverPreview: null, ogPreview: null,
      })
    },

    loadPost: (post) => {
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = null
      firstDirtyAt = null
      set({
        postId: post.id, version: post.version, post, fields: fieldsFrom(post), pending: {},
        contentDirty: false, saveState: 'idle', saveError: null, conflictVersion: null,
        checklist: post.checklist, stats: post.stats, hasUnpublishedChanges: post.has_unpublished_changes,
        lastSavedAt: Date.parse(post.updated_at), slugError: null, warnings: [],
        coverPreview: previewOf(post.cover), ogPreview: previewOf(post.og_image),
      })
    },

    applyDetail: (post, opts) => {
      set((st) => ({
        post,
        version: post.version,
        checklist: post.checklist,
        stats: post.stats,
        hasUnpublishedChanges: post.has_unpublished_changes,
        fields: opts?.replaceFields ? fieldsFrom(post) : { ...st.fields, slug: post.slug },
        coverPreview: opts?.replaceFields ? previewOf(post.cover) : st.coverPreview,
        ogPreview: opts?.replaceFields ? previewOf(post.og_image) : st.ogPreview,
        saveState: st.saveState === 'conflict' ? 'saved' : st.saveState,
      }))
    },

    setField: (key, value, delayMs = IDLE_DELAY_MS) => {
      set((st) => ({ fields: { ...st.fields, [key]: value }, pending: { ...st.pending, [key]: value } }))
      schedule(delayMs)
    },

    setSeo: (patch) => {
      set((st) => ({
        fields: { ...st.fields, seo: { ...st.fields.seo, ...patch } },
        pending: { ...st.pending, seo: { ...st.fields.seo, ...patch } },
      }))
      schedule(IDLE_DELAY_MS)
    },

    markContentDirty: (delayMs = IDLE_DELAY_MS) => {
      if (!get().contentDirty) set({ contentDirty: true })
      schedule(delayMs)
    },

    flush: () => {
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = null
      if (get().saveState === 'conflict') return Promise.resolve(false)
      if (inFlight) {
        queued = true
        return inFlight
      }
      inFlight = runSave().finally(() => {
        inFlight = null
        const s = get()
        if (queued || ((Object.keys(s.pending).length || s.contentDirty) && s.saveState === 'saved')) {
          queued = false
          void get().flush()
        }
      })
      return inFlight
    },

    keepMine: () => {
      const v = get().conflictVersion
      if (v == null) return Promise.resolve(false)
      set({ version: v, conflictVersion: null, saveState: 'idle' })
      // Re-send everything local, not just the last delta. An auto slug is
      // left out: sending a slug would lock it.
      const resend: Partial<PostWritable> = { ...get().fields }
      delete resend.content
      if (!resend.slug_locked) {
        delete resend.slug
        delete resend.slug_locked
      }
      set({ pending: resend, contentDirty: true })
      return get().flush()
    },

    flushOnUnload: () => {
      const s = get()
      if (!s.postId || s.saveState === 'conflict') return
      const changes: Partial<PostWritable> = { ...s.pending }
      if (s.contentDirty && contentGetter) changes.content = contentGetter()
      if (Object.keys(changes).length) void updatePostKeepalive(s.postId, s.version, changes)
    },
  }
})
