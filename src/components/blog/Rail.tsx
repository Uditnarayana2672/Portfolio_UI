import { useEffect, useRef, useState } from 'react'
import { BlogApiError, createCategory, listCategories, listTags } from '../../api/blogApi'
import { currentContent, useBlogEditorStore } from '../../store/blogEditorStore'
import { formatZoned } from '../../lib/zonedTime'
import type { BlogCategory, TipTapNode } from '../../types/blog'
import { clearImage, pickImage } from './coverActions'
import s from './blogUi.module.css'

function Panel({ tag, title, children, id }: { tag: string; title: string; children: React.ReactNode; id?: string }) {
  return (
    <section className={`${s.panel} wobble`} id={id}>
      <span className={s.cornerTag}>/// {tag}</span>
      <h3 className={s.panelTitle}>{title}</h3>
      {children}
    </section>
  )
}

function Meter({ value, range, hard }: { value: number; range: [number, number]; hard: number }) {
  const ok = value >= range[0] && value <= range[1]
  return (
    <div className={s.meter}>
      <div className={`${s.meterBar}${ok ? '' : ` ${s.meterWarn}`}`}>
        <div style={{ width: `${Math.min(100, (value / range[1]) * 100)}%` }} />
      </div>
      <span>{value} / {range[1]}{value > hard ? ' · too long' : ''}</span>
    </div>
  )
}

const thumb = (url: string, t: string) => (url.includes('/upload/') ? url.replace('/upload/', `/upload/${t}/`) : url)

// ── status ───────────────────────────────────────────────────────────────────

function StatusPanel({ onOpenSchedule }: { onOpenSchedule: () => void }) {
  const post = useBlogEditorStore((x) => x.post)
  const allowComments = useBlogEditorStore((x) => x.fields.allow_comments)
  const setField = useBlogEditorStore((x) => x.setField)
  const tz = useBlogEditorStore((x) => x.config?.timezone) ?? 'Asia/Kolkata'
  const status = post?.status ?? 'draft'
  const steps = ['draft', 'scheduled', 'published'] as const
  return (
    <Panel tag="status" title="Publish">
      {/* Read-only: actions live on the publish bar so the two can't disagree. */}
      <div className={s.seg} aria-label={`Status: ${status}`}>
        {steps.map((st) => (
          <span key={st} className={`${s.segItem}${status === st ? ` ${s.segOn}` : ''}`}>
            {st === 'draft' ? 'Draft' : st === 'scheduled' ? 'Scheduled' : 'Published'}
          </span>
        ))}
      </div>
      {post?.schedule_error && <div className={s.error}>{post.schedule_error}</div>}
      <div className={s.field}>
        <div className={s.fl}>Scheduled at <span className={s.hint}>{tz === 'Asia/Kolkata' ? 'IST' : tz}</span></div>
        {status === 'scheduled' && post?.scheduled_at ? (
          <button type="button" className={s.linkish} onClick={onOpenSchedule}>{formatZoned(post.scheduled_at, tz)} · change</button>
        ) : (
          <button type="button" className={s.linkish} onClick={onOpenSchedule} disabled={!post || status === 'published'}>
            {status === 'published' ? '—' : 'Not scheduled · pick a time'}
          </button>
        )}
      </div>
      {post?.published_at && (
        <div className={s.field}>
          <div className={s.fl}>First published</div>
          <div className={s.value}>{formatZoned(post.published_at, tz)}</div>
        </div>
      )}
      <label className={s.check}>
        <input type="checkbox" checked={allowComments} onChange={(e) => setField('allow_comments', e.target.checked, 0)} />
        allow comments
      </label>
    </Panel>
  )
}

// ── category & tags ──────────────────────────────────────────────────────────

function TaxonomyPanel() {
  const categoryId = useBlogEditorStore((x) => x.fields.category_id)
  const tags = useBlogEditorStore((x) => x.fields.tags)
  const setField = useBlogEditorStore((x) => x.setField)
  const limits = useBlogEditorStore((x) => x.config?.limits)
  const [cats, setCats] = useState<BlogCategory[]>([])
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [catError, setCatError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [suggestions, setSuggestions] = useState<{ tag: string; count: number }[]>([])
  const maxTags = limits?.tags_max ?? 8

  useEffect(() => {
    listCategories().then((r) => setCats(r.items)).catch(() => setCats([]))
  }, [])

  useEffect(() => {
    if (!draft.trim()) return
    const t = setTimeout(() => {
      listTags(draft).then((r) => setSuggestions(r.items.filter((i) => !tags.includes(i.tag)))).catch(() => {})
    }, 200)
    return () => clearTimeout(t)
  }, [draft, tags])

  function normalize(t: string) {
    return t.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  }

  function addTag(raw: string) {
    const t = normalize(raw)
    setDraft('')
    setSuggestions([])
    if (!t || tags.includes(t) || tags.length >= maxTags) return
    if (limits && (t.length < limits.tag_length[0] || t.length > limits.tag_length[1])) return
    setField('tags', [...tags, t], 0)
  }

  async function saveCategory() {
    setCatError(null)
    try {
      const c = await createCategory(newName)
      setCats((cur) => [...cur, c])
      setField('category_id', c.id, 0)
      setAdding(false)
      setNewName('')
    } catch (e) {
      if (e instanceof BlogApiError && e.code === 'CATEGORY_EXISTS') {
        const existing = e.detail.existing as { id: string } | undefined
        if (existing) setField('category_id', existing.id, 0)
        setAdding(false)
        setNewName('')
        return
      }
      setCatError(e instanceof Error ? e.message : 'Could not add the category')
    }
  }

  return (
    <Panel tag="taxonomy" title="Category & tags">
      <div className={s.field}>
        <div className={s.fl}>Category <span className={s.hint}>required to publish</span></div>
        {adding ? (
          <div className={s.inline}>
            <input
              className={s.input}
              value={newName}
              autoFocus
              maxLength={40}
              placeholder="New category name"
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void saveCategory()
                if (e.key === 'Escape') setAdding(false)
              }}
            />
            <button type="button" className={s.btnSmall} onClick={() => void saveCategory()} disabled={newName.trim().length < 2}>Add</button>
          </div>
        ) : (
          <select
            className={s.input}
            value={categoryId ?? ''}
            onChange={(e) => {
              if (e.target.value === '__new') setAdding(true)
              else setField('category_id', e.target.value || null, 0)
            }}
          >
            <option value="">Pick a category…</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value="__new">+ New category…</option>
          </select>
        )}
        {catError && <div className={s.error}>{catError}</div>}
      </div>
      <div className={s.field}>
        <div className={s.fl}>Tags <span className={s.hint}>enter or comma to add · {tags.length}/{maxTags}</span></div>
        <div className={s.tagField}>
          {tags.map((t) => (
            <span key={t} className={s.chip}>
              {t}
              <button type="button" className={s.chipX} aria-label={`Remove ${t}`}
                onClick={() => setField('tags', tags.filter((x) => x !== t), 0)}>×</button>
            </span>
          ))}
          {tags.length < maxTags && (
            <input
              className={s.addTag}
              value={draft}
              placeholder="+ add…"
              onChange={(e) => {
                const v = e.target.value
                if (v.endsWith(',')) addTag(v.slice(0, -1))
                else setDraft(v)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag(draft)
                }
                if (e.key === 'Backspace' && !draft && tags.length) setField('tags', tags.slice(0, -1), 0)
              }}
              onBlur={() => draft && addTag(draft)}
            />
          )}
        </div>
        {draft.trim() && suggestions.length > 0 && (
          <div className={s.suggest}>
            {suggestions.map((sg) => (
              <button key={sg.tag} type="button" className={s.chip} onMouseDown={(e) => { e.preventDefault(); addTag(sg.tag) }}>
                {sg.tag} <span className={s.hint}>{sg.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Panel>
  )
}

// ── cover & excerpt ──────────────────────────────────────────────────────────

function firstParagraph(doc: { content?: TipTapNode[] }): string {
  for (const n of doc.content ?? []) {
    if (n.type === 'paragraph') {
      const text = (n.content ?? []).map((c) => c.text ?? '').join('').trim()
      if (text) return text
    }
  }
  return ''
}

function CardPanel() {
  const cover = useBlogEditorStore((x) => x.coverPreview)
  const excerpt = useBlogEditorStore((x) => x.fields.excerpt) ?? ''
  const subtitle = useBlogEditorStore((x) => x.fields.subtitle)
  const setField = useBlogEditorStore((x) => x.setField)
  const limits = useBlogEditorStore((x) => x.config?.limits)

  function suggest() {
    const text = subtitle?.trim() || firstParagraph(currentContent())
    if (!text) return
    const max = limits?.excerpt[1] ?? 200
    setField('excerpt', text.length > max ? `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : text)
  }

  return (
    <Panel tag="cover & excerpt" title="Card preview">
      <div className={s.field}>
        <div className={s.fl}>Cover image</div>
        {cover ? (
          <div className={s.thumbWrap}>
            <img className={s.thumbImg} src={thumb(cover.url, 'f_auto,q_auto,w_640,h_360,c_fill')} alt={cover.alt ?? ''} />
            <div className={s.thumbActs}>
              <button type="button" className={s.btnSmall} onClick={() => pickImage('cover')}>Replace</button>
              <button type="button" className={s.btnSmall} onClick={() => clearImage('cover')}>Remove</button>
            </div>
          </div>
        ) : (
          <button type="button" className={s.coverThumb} onClick={() => pickImage('cover')}>click to add cover</button>
        )}
      </div>
      <div className={s.field}>
        <div className={s.fl}>
          Excerpt <span className={s.hint}>card & search fallback · {limits?.excerpt[0] ?? 80}–{limits?.excerpt[1] ?? 200}</span>
        </div>
        <textarea
          className={s.textarea}
          value={excerpt}
          maxLength={limits?.excerpt_hard_max ?? 300}
          onChange={(e) => setField('excerpt', e.target.value || null)}
          placeholder="One or two sentences that make people want to read it."
        />
        <Meter value={excerpt.length} range={limits?.excerpt ?? [80, 200]} hard={limits?.excerpt[1] ?? 200} />
        {!excerpt && <button type="button" className={s.linkish} onClick={suggest}>use subtitle / first paragraph</button>}
      </div>
    </Panel>
  )
}

// ── SEO ──────────────────────────────────────────────────────────────────────

function SeoPanel() {
  const title = useBlogEditorStore((x) => x.fields.title)
  const slug = useBlogEditorStore((x) => x.fields.slug)
  const excerpt = useBlogEditorStore((x) => x.fields.excerpt)
  const seo = useBlogEditorStore((x) => x.fields.seo)
  const og = useBlogEditorStore((x) => x.ogPreview)
  const cover = useBlogEditorStore((x) => x.coverPreview)
  const setSeo = useBlogEditorStore((x) => x.setSeo)
  const config = useBlogEditorStore((x) => x.config)
  const suffix = config?.title_suffix ?? ' · Udit N.'
  const site = (config?.site_url ?? 'https://uditnarayana.dev').replace(/\/$/, '')
  const domain = site.replace(/^https?:\/\//, '')
  const effTitle = seo.meta_title || `${title || 'Untitled'}${suffix}`
  const effDesc = seo.meta_description || excerpt || ''
  const canonical = `${site}/blog/${slug || 'your-post'}`
  const shareImage = og ?? cover
  const limits = config?.limits

  return (
    <Panel tag="seo" title="Search & social">
      <div className={s.field}>
        <div className={s.fl}>Meta title <span className={s.hint}>{limits?.meta_title.join('–') ?? '30–60'} · empty = title{suffix}</span></div>
        <input
          className={s.input}
          value={seo.meta_title ?? ''}
          maxLength={limits?.meta_title_hard_max ?? 70}
          placeholder={`${title || 'Untitled'}${suffix}`}
          onChange={(e) => setSeo({ meta_title: e.target.value || null })}
        />
        <Meter value={effTitle.length} range={limits?.meta_title ?? [30, 60]} hard={60} />
      </div>
      <div className={s.field}>
        <div className={s.fl}>Meta description <span className={s.hint}>{limits?.meta_description.join('–') ?? '120–160'} · empty = excerpt</span></div>
        <textarea
          className={s.textarea}
          value={seo.meta_description ?? ''}
          maxLength={limits?.meta_description_hard_max ?? 200}
          placeholder={excerpt ?? 'What will a searcher learn from this post?'}
          onChange={(e) => setSeo({ meta_description: e.target.value || null })}
        />
        <Meter value={effDesc.length} range={limits?.meta_description ?? [120, 160]} hard={160} />
      </div>
      <div className={s.field}>
        <div className={s.fl}>Canonical URL <span className={s.hint}>leave empty unless this is a copy</span></div>
        <input
          className={s.input}
          value={seo.canonical_url ?? ''}
          placeholder={canonical}
          onChange={(e) => setSeo({ canonical_url: e.target.value || null })}
        />
      </div>
      <div className={s.field}>
        <div className={s.fl}>Social share image <span className={s.hint}>1200 × 630 · empty = cover</span></div>
        {og ? (
          <div className={s.thumbWrap}>
            <img className={s.thumbImg} src={thumb(og.url, 'f_auto,q_auto,w_600,h_315,c_fill')} alt="" />
            <div className={s.thumbActs}>
              <button type="button" className={s.btnSmall} onClick={() => pickImage('og')}>Replace</button>
              <button type="button" className={s.btnSmall} onClick={() => clearImage('og')}>Remove</button>
            </div>
          </div>
        ) : (
          <button type="button" className={`${s.coverThumb} ${s.coverThumbShort}`} onClick={() => pickImage('og')}>
            {cover ? 'using cover · click to set a dedicated one' : 'og-image · 1200 × 630'}
          </button>
        )}
      </div>
      <div className={s.field}>
        <div className={s.fl}>Google preview</div>
        <div className={s.seoBox}>
          <div className={s.seoUrl}>{domain} › blog › {slug || 'your-post'}</div>
          <div className={s.seoTitle}>{effTitle.length > 60 ? `${effTitle.slice(0, 57)}…` : effTitle}</div>
          <div className={s.seoDesc}>{effDesc.length > 158 ? `${effDesc.slice(0, 155)}…` : effDesc || 'Add a meta description or excerpt.'}</div>
        </div>
      </div>
      <div className={s.field}>
        <div className={s.fl}>Social card preview</div>
        <div className={s.socialCard}>
          {shareImage ? <img src={thumb(shareImage.url, 'c_fill,g_auto,w_600,h_315,f_auto,q_auto')} alt="" /> : <div className={s.socialEmpty}>no image</div>}
          <div className={s.socialText}>
            <div className={s.socialDomain}>{domain.toUpperCase()}</div>
            <div className={s.socialTitle}>{effTitle}</div>
            <div className={s.socialDesc}>{effDesc}</div>
          </div>
        </div>
      </div>
    </Panel>
  )
}

// ── checklist ────────────────────────────────────────────────────────────────

function ChecklistPanel({ highlight }: { highlight: boolean }) {
  const checklist = useBlogEditorStore((x) => x.checklist)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (highlight) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlight])
  return (
    <div ref={ref} className={highlight ? s.flash : undefined}>
      <Panel tag="checklist" title="Before publish" id="blog-checklist">
        {!checklist ? (
          <div className={s.note}>Starts checking once the post is saved.</div>
        ) : (
          <>
            <div className={s.checks}>
              {checklist.items.map((i) => {
                const cls = i.passed ? s.chkOk : i.level === 'blocker' ? s.chkBad : s.chkWarn
                return (
                  <div key={i.key} className={`${s.chk} ${cls}`} title={i.message ?? undefined}>
                    <span className={s.mark}>{i.passed ? '✓' : '!'}</span>
                    <span>
                      {i.label}
                      {!i.passed && i.message && <span className={s.chkMsg}> — {i.message}</span>}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className={s.note}>
              {checklist.can_publish
                ? checklist.warning_count ? `Ready. ${checklist.warning_count} suggestion(s) won’t block publishing.` : 'Everything is green.'
                : `${checklist.blocker_count} blocker(s) to fix before publishing or scheduling.`}
            </div>
          </>
        )}
      </Panel>
    </div>
  )
}

export default function Rail({ onOpenSchedule, highlightChecklist }: { onOpenSchedule: () => void; highlightChecklist: boolean }) {
  return (
    <aside className={s.rail}>
      <StatusPanel onOpenSchedule={onOpenSchedule} />
      <TaxonomyPanel />
      <CardPanel />
      <SeoPanel />
      <ChecklistPanel highlight={highlightChecklist} />
    </aside>
  )
}
