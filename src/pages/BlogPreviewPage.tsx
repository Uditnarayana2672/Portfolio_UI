import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BlogApiError, getPost, getPreview, publishPost } from '../api/blogApi'
import { enhanceArticle } from '../lib/blogArticleBehaviour'
import { formatZoned } from '../lib/zonedTime'
import type { PostDetail, PreviewPayload } from '../types/blog'
import ui from '../components/blog/blogUi.module.css'
import s from './BlogPreviewPage.module.css'
import '../styles/blogArticle.css'

// Admin preview — same pattern as /admin/projects/:id/preview. Renders the
// server's reader payload in a temporary article template until the public
// blog page is designed; both read the same PublicPost shape.

const TZ = 'Asia/Kolkata'

export default function BlogPreviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<PreviewPayload | null>(null)
  const [post, setPost] = useState<PostDetail | null>(null)
  const [source, setSource] = useState<'working' | 'live'>('working')
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [error, setError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const articleRef = useRef<HTMLDivElement>(null)

  const [reloadTick, setReloadTick] = useState(0)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    Promise.all([getPreview(id, source), getPost(id)])
      .then(([preview, detail]) => {
        if (cancelled) return
        setData(preview)
        setPost(detail)
        setError(null)
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Could not load the preview'))
    return () => { cancelled = true }
  }, [id, source, reloadTick])

  useEffect(() => {
    if (data) document.title = `Preview · ${data.post.head.title}`
  }, [data])

  useEffect(() => {
    const el = articleRef.current
    if (!el || !data) return
    return enhanceArticle(el)
  }, [data, device])

  async function publish() {
    if (!post) return
    setPublishing(true)
    try {
      const detail = await publishPost(post.id, post.version)
      setPost(detail)
      setToast(post.status === 'published' ? 'Live post updated ✓' : 'Published ✓')
      setReloadTick((n) => n + 1)
    } catch (e) {
      setToast(e instanceof BlogApiError && e.code === 'CHECKLIST_FAILED'
        ? 'Checklist blockers remain — fix them in the editor.'
        : e instanceof Error ? e.message : 'Publish failed')
    } finally {
      setPublishing(false)
      setTimeout(() => setToast(null), 4000)
    }
  }

  if (error) {
    return (
      <div className={s.page}>
        <div className={ui.error}>{error}</div>
        <button type="button" className={ui.btnGhost} onClick={() => navigate(`/admin/blogs/${id}/edit`)}>← Back to editor</button>
      </div>
    )
  }
  if (!data || !post) return <div className={s.page}><div className={ui.note}>Loading preview…</div></div>

  const p = data.post
  const live = post.status === 'published'
  const canPublish = data.checklist.can_publish && (!live || post.has_unpublished_changes) && source === 'working'

  return (
    <div className={s.page}>
      {toast && <div className={s.toast} role="status">{toast}</div>}

      <div className={s.bar}>
        <button type="button" className={ui.btnGhost} onClick={() => navigate(`/admin/blogs/${id}/edit`)}>← Editor</button>
        <span className={s.barTag}>Preview · {source === 'live' ? 'live version' : 'your latest changes'}</span>
        {live && post.has_unpublished_changes && (
          <div className={s.toggle}>
            <button type="button" className={source === 'working' ? s.on : ''} onClick={() => setSource('working')}>With changes</button>
            <button type="button" className={source === 'live' ? s.on : ''} onClick={() => setSource('live')}>Live</button>
          </div>
        )}
        <div className={s.toggle}>
          <button type="button" className={device === 'desktop' ? s.on : ''} onClick={() => setDevice('desktop')}>Desktop</button>
          <button type="button" className={device === 'mobile' ? s.on : ''} onClick={() => setDevice('mobile')}>Mobile</button>
        </div>
        <span className={s.spacer} />
        <button type="button" className={ui.btnPrimary} disabled={!canPublish || publishing} onClick={() => void publish()}>
          {publishing ? 'Publishing…' : live ? '↗ Update' : '↗ Publish'}
        </button>
      </div>

      <div className={s.layout}>
        <div className={`${s.frame} ${device === 'mobile' ? s.frameMobile : ''}`}>
          <div ref={articleRef} className="bp-page">
            <header className="bp-head">
              {p.category && <a className="bp-kicker" href={p.category.url}>{p.category.name}</a>}
              <h1 className="bp-title">{p.title || 'Untitled'}</h1>
              {p.subtitle && <p className="bp-subtitle">{p.subtitle}</p>}
              <div className="bp-byline">
                <span>{p.author.name}</span>
                <span>·</span>
                <span>{p.published_at ? formatZoned(p.published_at, TZ) : 'Not published yet'}</span>
                <span>·</span>
                <span>{p.reading_time_min} min read</span>
              </div>
            </header>
            {p.cover && (
              <figure className="bp-cover">
                <img src={p.cover.url} srcSet={p.cover.srcset} sizes="(max-width: 900px) 100vw, 900px" alt={p.cover.alt}
                  width={p.cover.width ?? undefined} height={p.cover.height ?? undefined} />
              </figure>
            )}
            <div className="bp-body">
              {p.toc.length > 2 && (
                <nav className="bp-toc" aria-label="Contents">
                  <div className="bp-toc__title">Contents</div>
                  <ol>
                    {p.toc.filter((t) => t.level <= 3).map((t) => (
                      <li key={t.id} className={`bp-toc__l${t.level}`}>
                        <a href={`#${t.id}`}>{t.number ? `${t.number}. ` : ''}{t.text}</a>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
              {/* Server-rendered from the allowlisted document with every value escaped. */}
              <article className="bp-article" dangerouslySetInnerHTML={{ __html: p.content_html }} />
              {p.tags.length > 0 && (
                <div className="bp-tags">
                  {p.tags.map((t) => <a key={t.name} href={t.url}>#{t.name}</a>)}
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className={s.side}>
          <section className={`${ui.panel} wobble`}>
            <span className={ui.cornerTag}>/// google</span>
            <h3 className={ui.panelTitle}>Search result</h3>
            <div className={ui.seoBox}>
              <div className={ui.seoUrl}>{data.search_preview.url_display}</div>
              <div className={ui.seoTitle}>{data.search_preview.title}</div>
              <div className={ui.seoDesc}>{data.search_preview.description || 'No description yet.'}</div>
            </div>
            {(data.search_preview.title_truncated || data.search_preview.description_truncated) && (
              <div className={ui.note}>Google will cut this off — shorten the {data.search_preview.title_truncated ? 'title' : 'description'}.</div>
            )}
          </section>
          <section className={`${ui.panel} wobble`}>
            <span className={ui.cornerTag}>/// social</span>
            <h3 className={ui.panelTitle}>Share card</h3>
            <div className={ui.socialCard}>
              {data.social_preview.image_url
                ? <img src={data.social_preview.image_url} alt="" />
                : <div className={ui.socialEmpty}>no image</div>}
              <div className={ui.socialText}>
                <div className={ui.socialDomain}>{data.social_preview.domain.toUpperCase()}</div>
                <div className={ui.socialTitle}>{data.social_preview.title}</div>
                <div className={ui.socialDesc}>{data.social_preview.description}</div>
              </div>
            </div>
            <div className={ui.note}>Image source: {data.social_preview.image_source === 'og' ? 'social image' : data.social_preview.image_source === 'cover' ? 'cover (fallback)' : 'none'}</div>
          </section>
          <section className={`${ui.panel} wobble`}>
            <span className={ui.cornerTag}>/// checklist</span>
            <h3 className={ui.panelTitle}>Before publish</h3>
            <div className={ui.checks}>
              {data.checklist.items.map((i) => (
                <div key={i.key} className={`${ui.chk} ${i.passed ? ui.chkOk : i.level === 'blocker' ? ui.chkBad : ui.chkWarn}`}>
                  <span className={ui.mark}>{i.passed ? '✓' : '!'}</span>
                  <span>{i.label}{!i.passed && i.message && <span className={ui.chkMsg}> — {i.message}</span>}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
