// The 14 project blocks, as visitors see them. A contract test checks this list
// against the backend, so a new block type can't silently disappear.
import { useEffect, useMemo, useState } from 'react'
import hljs from 'highlight.js/lib/common'
import { blurredBackdrop, cropped, natural, usableImage } from '../images'
import { ContactForm, Poll } from '../Interactions'
import type { ProjectBlock } from '../types'

type Cfg = Record<string, unknown>

export const BLOCK_TYPES = [
  'hero', 'text', 'image', 'gallery', 'video', 'code', 'timeline', 'stats', 'poll', 'quote', 'comparison', 'cta', 'form', 'embed',
] as const

/** Blocks that need browser JavaScript, so the page hydrates only these. */
export const INTERACTIVE_BLOCKS = new Set(['poll', 'form', 'gallery'])

const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const arr = <T = Cfg>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])
const safeLink = (v: unknown): string | null => {
  const url = str(v).trim()
  return /^(https?:\/\/|mailto:|\/|#[a-z0-9])/i.test(url) ? url : null
}

function Header({ cfg, no }: { cfg: Cfg; no: number | null }) {
  const eyebrow = str(cfg.eyebrow)
  const heading = str(cfg.heading)
  const sub = str(cfg.subheading)
  if (!eyebrow && !heading && !sub) return null
  return (
    <header className="b-head">
      {eyebrow && <p className="eyebrow">{no != null && <span className="n">{String(no).padStart(2, '0')}</span>}{eyebrow}</p>}
      {heading && <h2 className="b-title">{heading}</h2>}
      {sub && <p className="b-sub">{sub}</p>}
    </header>
  )
}

function Hero({ cfg }: { cfg: Cfg }) {
  const url = usableImage(cfg.background_image_url)
  const bg = str(cfg.background_color)
  const caption = str(cfg.caption)
  const alt = str(cfg.alt_text) || str(cfg.heading)
  const minHeight = str(cfg.min_height)
  const ratio = minHeight === '100vh' ? '16:8' : minHeight === '40vh' ? '21:7' : '21:9'
  if (!url && !bg) return null
  return (
    <figure className="b-hero" data-height={minHeight || '60vh'} style={bg ? { background: bg } : undefined}>
      {url && (
        <img
          src={cropped(url, 1600, ratio)}
          srcSet={`${cropped(url, 800, ratio)} 800w, ${cropped(url, 1600, ratio)} 1600w, ${cropped(url, 2200, ratio)} 2200w`}
          sizes="(max-width: 1240px) 100vw, 1180px"
          alt={alt === 'Hero' ? '' : alt}
          fetchPriority="high"
        />
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

function Text({ cfg, no }: { cfg: Cfg; no: number | null }) {
  const content = str(cfg.content)
  if (!content.trim() && !str(cfg.heading)) return null
  return (
    <div className="b-col" data-width={str(cfg.max_width) || 'default'}>
      <Header cfg={cfg} no={no} />
      {/* The API cleans this HTML before it reaches a page. */}
      <div className="b-prose" data-style={str(cfg.style) || 'standard'} dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  )
}

function ImageBlock({ cfg, no, fig }: { cfg: Cfg; no: number | null; fig: number }) {
  const url = usableImage(cfg.image_url)
  if (!url) return null
  const caption = str(cfg.caption)
  const link = safeLink(cfg.link_url)
  const display = str(cfg.display) || 'auto'
  const image = (
    <span className="b-matte" style={{ backgroundImage: `url("${blurredBackdrop(url)}")` }}>
      <img src={natural(url)} alt={str(cfg.alt_text) || caption} loading="lazy" className={display === 'blend' ? 'tone' : undefined} />
    </span>
  )
  return (
    <div className="b-col">
      <Header cfg={cfg} no={no} />
      <figure
        className={`b-image${cfg.rounded === true ? ' rounded' : ''}`}
        data-width={str(cfg.width) || 'medium'}
        data-align={str(cfg.align) || 'center'}
      >
        {link ? <a href={link}>{image}</a> : image}
        {caption && <figcaption><span className="fig-no">Fig {fig}</span>{caption}</figcaption>}
      </figure>
    </div>
  )
}

function Gallery({ cfg, no }: { cfg: Cfg; no: number | null }) {
  const images = arr(cfg.images)
    .map((im) => ({
      url: usableImage(im.url) ?? usableImage(im.imageUrl) ?? usableImage(im.src) ?? usableImage(im.image_url),
      alt: str(im.alt),
      caption: str(im.caption),
    }))
    .filter((im): im is { url: string; alt: string; caption: string } => !!im.url)
  const layout = str(cfg.layout) || 'grid'
  const captions = cfg.show_captions !== false
  const [open, setOpen] = useState<number | null>(null)
  const [idx, setIdx] = useState(0)
  const sliding = layout === 'carousel' || layout === 'filmstrip'

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') setOpen((i) => ((i ?? 0) + 1) % images.length)
      if (e.key === 'ArrowLeft') setOpen((i) => ((i ?? 0) - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, images.length])

  if (!images.length) return null
  const shown = sliding ? [images[idx]] : images
  const go = (i: number) => setIdx((i + images.length) % images.length)
  return (
    <div className="b-wide">
      <Header cfg={cfg} no={no} />
      <div
        className="b-gallery"
        data-layout={layout}
        data-gap={str(cfg.gap) || 'md'}
        style={sliding ? undefined : { ['--cols' as string]: num(cfg.columns, 3) }}
      >
        {shown.map((im) => {
          const realIndex = images.indexOf(im)
          return (
            <figure key={im.url}>
              <button type="button" className="b-gallery-open" onClick={() => setOpen(realIndex)} aria-label={`Open image ${realIndex + 1} full screen`}>
                <img src={sliding ? natural(im.url, 1400) : cropped(im.url, 800, '4:3')} alt={im.alt || im.caption} loading="lazy" />
              </button>
              {captions && im.caption && <figcaption>{im.caption}</figcaption>}
            </figure>
          )
        })}
      </div>
      {sliding && images.length > 1 && (
        <div className="b-gallery-ctl">
          <button type="button" onClick={() => go(idx - 1)} aria-label="Previous image">←</button>
          {layout === 'filmstrip' ? (
            <div className="b-thumbs">
              {images.map((im, i) => (
                <button type="button" key={im.url} className={i === idx ? 'on' : ''} onClick={() => setIdx(i)} aria-label={`Image ${i + 1}`}>
                  <img src={cropped(im.url, 160, '1:1')} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          ) : <span className="mono">{idx + 1} / {images.length}</span>}
          <button type="button" onClick={() => go(idx + 1)} aria-label="Next image">→</button>
        </div>
      )}
      {open !== null && (
        <div className="b-lightbox" role="dialog" aria-modal="true" aria-label="Image viewer" onClick={() => setOpen(null)}>
          <button type="button" className="b-lightbox-close" aria-label="Close">✕</button>
          <img src={natural(images[open].url, 2000)} alt={images[open].alt || images[open].caption} onClick={(e) => e.stopPropagation()} />
          {images[open].caption && <p>{images[open].caption}</p>}
        </div>
      )}
    </div>
  )
}

function videoSource(raw: string): { kind: 'iframe' | 'file' | 'link'; url: string } {
  const yt = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/)
  if (yt) return { kind: 'iframe', url: `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1` }
  const vimeo = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) return { kind: 'iframe', url: `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1` }
  const loom = raw.match(/loom\.com\/(?:share|embed)\/([\w-]+)/)
  if (loom) return { kind: 'iframe', url: `https://www.loom.com/embed/${loom[1]}?autoplay=1` }
  if (/\.(mp4|webm|mov)(\?|$)/i.test(raw) || raw.includes('res.cloudinary.com')) return { kind: 'file', url: raw }
  return { kind: 'link', url: raw }
}

function Video({ cfg, no }: { cfg: Cfg; no: number | null }) {
  const raw = str(cfg.video_url)
  const caption = str(cfg.caption)
  if (!raw.startsWith('http')) return null
  const source = videoSource(raw)
  const poster = usableImage(cfg.thumbnail_url)
  return (
    <div className="b-col" data-width={str(cfg.width) === 'full' ? 'wide' : 'default'}>
      <Header cfg={cfg} no={no} />
      <figure className="b-video">
        {source.kind === 'iframe' && (
          <div className="b-frame" data-video-frame data-src={source.url} data-title={caption || 'Video'}>
            <button type="button" className="b-play" data-video-play aria-label={`Play video${caption ? `: ${caption}` : ''}`}>
              {poster && <img src={poster} alt="" loading="lazy" />}
              <span aria-hidden="true">▶</span>
            </button>
          </div>
        )}
        {source.kind === 'file' && (
          <video
            className="b-frame"
            src={source.url}
            poster={poster ?? undefined}
            controls={cfg.controls !== false}
            muted={cfg.muted === true || cfg.autoplay === true}
            loop={cfg.loop === true}
            autoPlay={cfg.autoplay === true}
            playsInline
            preload="metadata"
          />
        )}
        {source.kind === 'link' && <a className="b-video-link" href={source.url} target="_blank" rel="noopener noreferrer">Watch this video ↗</a>}
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    </div>
  )
}

/** Highlight, then split into lines while keeping multi-line spans balanced. */
function highlightedLines(code: string, language: string): string[] {
  const html = language && language !== 'plaintext' && hljs.getLanguage(language)
    ? hljs.highlight(code, { language, ignoreIllegals: true }).value
    : code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const open: string[] = []
  return html.split('\n').map((line) => {
    const prefix = open.join('')
    for (const tag of line.match(/<span[^>]*>|<\/span>/g) ?? []) {
      if (tag === '</span>') open.pop()
      else open.push(tag)
    }
    return prefix + line + '</span>'.repeat(open.length)
  })
}

function Code({ cfg, no }: { cfg: Cfg; no: number | null }) {
  const code = str(cfg.code).replace(/\n$/, '')
  const language = str(cfg.language) || 'plaintext'
  const showLines = cfg.show_line_numbers !== false
  const marked = new Set(arr<number>(cfg.highlight_lines).map(Number))
  const lines = useMemo(() => highlightedLines(code, language), [code, language])
  if (!code) return null
  return (
    <div className="b-col" data-width="wide">
      <Header cfg={cfg} no={no} />
      <figure className="b-code" data-theme={str(cfg.theme) === 'light' ? 'light' : 'dark'}>
        <figcaption>
          <span>{str(cfg.filename) || 'snippet'}</span>
          <span className="lang">{language}</span>
          <button type="button" data-copy-code data-code={code}>Copy</button>
        </figcaption>
        <pre><code>
          {lines.map((line, i) => (
            <span className={`row${marked.has(i + 1) ? ' hl' : ''}`} key={i}>
              {showLines && <span className="ln" aria-hidden="true">{i + 1}</span>}
              <span dangerouslySetInnerHTML={{ __html: line || ' ' }} />
            </span>
          ))}
        </code></pre>
      </figure>
    </div>
  )
}

function Timeline({ cfg, no }: { cfg: Cfg; no: number | null }) {
  const items = arr(cfg.items)
  if (!items.length) return null
  return (
    <div className="b-col">
      <Header cfg={cfg} no={no} />
      <ol className="b-timeline" data-direction={str(cfg.direction) || 'vertical'} data-lines={cfg.show_connectors === false ? 'off' : 'on'}>
        {items.map((it, i) => (
          <li key={i} className={it.done === true ? 'done' : ''}>
            <span className="dot" style={str(it.color) ? { borderColor: str(it.color), background: it.done === true ? str(it.color) : undefined } : undefined}>
              {str(it.icon)}
            </span>
            {str(it.date) && <div className="date">{str(it.date)}</div>}
            <h3>{str(it.title)}</h3>
            {str(it.description) && <p>{str(it.description)}</p>}
          </li>
        ))}
      </ol>
    </div>
  )
}

function Stats({ cfg, no }: { cfg: Cfg; no: number | null }) {
  const metrics = arr(cfg.metrics)
  if (!metrics.length) return null
  return (
    <div className="b-wide">
      <Header cfg={cfg} no={no} />
      <div className="b-stats" data-style={str(cfg.style) || 'card'} style={{ ['--cols' as string]: Math.min(num(cfg.columns, metrics.length), metrics.length) }}>
        {metrics.map((m, i) => (
          <div key={i}>
            {str(m.icon) && <span className="icon" aria-hidden="true">{str(m.icon)}</span>}
            <b style={str(m.color) ? { color: str(m.color) } : undefined}>{str(m.value)}{str(m.unit) && <i>{str(m.unit)}</i>}</b>
            <span>{str(m.label)}</span>
            {str(m.sub) && <small>{str(m.sub)}</small>}
          </div>
        ))}
      </div>
    </div>
  )
}

function Quote({ cfg, no }: { cfg: Cfg; no: number | null }) {
  const text = str(cfg.text)
  if (!text) return null
  const name = str(cfg.attribution_name)
  const role = str(cfg.attribution_role)
  const source = safeLink(cfg.source_url)
  return (
    <div className="b-col">
      <Header cfg={cfg} no={no} />
      <figure className="b-quote" data-style={str(cfg.style) || 'pullquote'}>
        <blockquote>{text}</blockquote>
        {(name || role) && (
          <figcaption>
            {name && <b>{name}</b>}{name && role && ' · '}{role}
            {source && <> · <a href={source} target="_blank" rel="noopener noreferrer">Source ↗</a></>}
          </figcaption>
        )}
      </figure>
    </div>
  )
}

function Comparison({ cfg, no }: { cfg: Cfg; no: number | null }) {
  return (
    <div className="b-col" data-width="wide">
      <Header cfg={cfg} no={no} />
      <div className="b-compare" data-style={str(cfg.style) || 'split'}>
        <div><h3>{str(cfg.left_label) || 'Before'}</h3><p>{str(cfg.left_content)}</p></div>
        <div className="after"><h3>{str(cfg.right_label) || 'After'}</h3><p>{str(cfg.right_content)}</p></div>
      </div>
    </div>
  )
}

function Cta({ cfg }: { cfg: Cfg }) {
  const label = str(cfg.primary_label)
  const url = safeLink(cfg.primary_url)
  const secondaryLabel = str(cfg.secondary_label)
  const secondaryUrl = safeLink(cfg.secondary_url)
  const description = str(cfg.description)
  const heading = str(cfg.heading)
  // The admin form has one text for the button, which also fills `heading`.
  const title = heading && heading !== label ? heading : description
  const body = heading && heading !== label ? description : ''
  const background = usableImage(cfg.background_image_url)
  if (!title && !(label && url)) return null
  return (
    <div
      className="b-cta"
      data-align={str(cfg.align) || 'center'}
      data-style={str(cfg.style) || 'filled'}
      style={{
        ...(str(cfg.background_color) ? { background: str(cfg.background_color) } : {}),
        ...(background ? { backgroundImage: `linear-gradient(rgba(32,35,40,.78),rgba(32,35,40,.78)),url("${cropped(background, 1600, '21:9')}")` } : {}),
      }}
    >
      {title && <h2>{title}</h2>}
      {body && <p>{body}</p>}
      <div className="row">
        {label && url && <a className="btn" href={url}>{label} <span aria-hidden="true">↗</span></a>}
        {secondaryLabel && secondaryUrl && <a className="btn-ghost" href={secondaryUrl}>{secondaryLabel} →</a>}
      </div>
    </div>
  )
}

// Older blocks saved mock ids. They map to the real fixed forms.
const FORM_SUBJECTS: Record<string, { type: string; title: string }> = {
  contact: { type: 'contact', title: 'Send a message' },
  discovery: { type: 'discovery', title: 'Request a discovery call' },
  feedback: { type: 'feedback', title: 'Share feedback' },
  'form-001': { type: 'contact', title: 'Send a message' },
  'form-002': { type: 'discovery', title: 'Request a discovery call' },
  'form-004': { type: 'feedback', title: 'Share feedback' },
}

function FormBlock({ cfg, no }: { cfg: Cfg; no: number | null }) {
  const form = FORM_SUBJECTS[str(cfg.form_id)] ?? FORM_SUBJECTS.contact
  return (
    <div className="b-col">
      <Header cfg={cfg} no={no} />
      <div className="b-form">
        <h3>{form.title}</h3>
        <ContactForm subject={str(cfg.form_name) || form.title} source={`block:${form.type}`} withTopic={false} />
      </div>
    </div>
  )
}

function Embed({ cfg, no }: { cfg: Cfg; no: number | null }) {
  const url = str(cfg.embed_url)
  if (!url.startsWith('https://')) return null
  const provider = str(cfg.provider)
  const caption = str(cfg.caption)
  return (
    <div className="b-col" data-width="wide">
      <Header cfg={cfg} no={no} />
      <figure className="b-embed">
        <div className="bar"><span>{str(cfg.source_label) || new URL(url).hostname}</span>{provider && <b>{provider}</b>}</div>
        <iframe
          src={url}
          title={provider || caption || 'Embedded content'}
          style={{ height: `min(${num(cfg.height, 480)}px, 75vh)` }}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          referrerPolicy="no-referrer"
          allowFullScreen={cfg.allow_fullscreen !== false}
        />
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    </div>
  )
}

export function BlockView({ block, no, fig }: { block: ProjectBlock; no: number | null; fig: number }) {
  const cfg = block.config ?? {}
  switch (block.block_type) {
    case 'hero': return <Hero cfg={cfg} />
    case 'text': return <Text cfg={cfg} no={no} />
    case 'image': return <ImageBlock cfg={cfg} no={no} fig={fig} />
    case 'gallery': return <Gallery cfg={cfg} no={no} />
    case 'video': return <Video cfg={cfg} no={no} />
    case 'code': return <Code cfg={cfg} no={no} />
    case 'timeline': return <Timeline cfg={cfg} no={no} />
    case 'stats': return <Stats cfg={cfg} no={no} />
    case 'poll': return <div className="b-col"><Header cfg={cfg} no={no} /><Poll blockId={block.id} question={str(cfg.question)} options={arr<string>(cfg.options).map(String)} /></div>
    case 'quote': return <Quote cfg={cfg} no={no} />
    case 'comparison': return <Comparison cfg={cfg} no={no} />
    case 'cta': return <Cta cfg={cfg} />
    case 'form': return <FormBlock cfg={cfg} no={no} />
    case 'embed': return <Embed cfg={cfg} no={no} />
    default: return null
  }
}
