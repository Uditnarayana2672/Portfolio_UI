import { useMemo, useState } from 'react'
import type { PublicBlock } from '../../types/publicProject'

// ── helpers ───────────────────────────────────────────────────────────────────

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}
function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}
function arr<T = Record<string, unknown>>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

function imageUrlOf(it: Record<string, unknown>): string {
  return str(it.url) || str(it.imageUrl) || str(it.src) || str(it.image_url)
}

// Eyebrow + heading shown above most blocks. `no` is the running section number.
function SectionHeader({
  cfg,
  no,
}: {
  cfg: Record<string, unknown>
  no: number | null
}) {
  const eyebrow = str(cfg.eyebrow)
  const heading = str(cfg.heading)
  const subheading = str(cfg.subheading)
  if (!eyebrow && !heading && !subheading) return null
  return (
    <>
      {eyebrow && (
        <p className="eyebrow">
          {no != null && <span className="no">{String(no).padStart(2, '0')}</span>}
          {eyebrow}
        </p>
      )}
      {heading && <h2 className="block-h">{heading}</h2>}
      {subheading && <p className="block-sub">{subheading}</p>}
    </>
  )
}

// Detect whether a block carries an editorial eyebrow (drives auto-numbering).
export function hasEyebrow(block: PublicBlock): boolean {
  return !!str(block.config.eyebrow)
}

// ── individual blocks ───────────────────────────────────────────────────────────

function HeroBlock({ cfg }: { cfg: Record<string, unknown> }) {
  const url = str(cfg.background_image_url)
  const caption = str(cfg.caption) || str(cfg.hero_caption)
  return (
    <figure className="hero-fig">
      {url ? (
        <img className="hero-img" src={url} alt={str(cfg.heading) || 'Hero'} />
      ) : (
        <div className="ph hero-ph">
          <span className="ph-tag">hero image</span>
        </div>
      )}
      {caption && <figcaption className="hero-cap">{caption}</figcaption>}
    </figure>
  )
}

function TextBlock({ cfg, no }: { cfg: Record<string, unknown>; no: number | null }) {
  const style = str(cfg.style) || 'standard'
  const content = str(cfg.content)
  return (
    <div className="col">
      <SectionHeader cfg={cfg} no={no} />
      <div className="prose" data-style={style} dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  )
}

function ImageBlock({ cfg, no, fig }: { cfg: Record<string, unknown>; no: number | null; fig: number }) {
  const url = str(cfg.image_url)
  const caption = str(cfg.caption)
  const rounded = cfg.rounded === true
  return (
    <div className="col">
      <SectionHeader cfg={cfg} no={no} />
      <figure className={`img-block${rounded ? ' rounded' : ''}`}>
        {url ? (
          <img src={url} alt={str(cfg.alt_text) || caption || 'Image'} />
        ) : (
          <div className="ph"><span className="ph-tag">image</span></div>
        )}
        {caption && (
          <figcaption>
            <span className="fc-no">fig {fig}</span>
            <span>{caption}</span>
          </figcaption>
        )}
      </figure>
    </div>
  )
}

function StatsBlock({ cfg, no }: { cfg: Record<string, unknown>; no: number | null }) {
  const metrics = arr(cfg.metrics)
  const style = str(cfg.style) || 'card'
  return (
    <>
      <SectionHeader cfg={cfg} no={no} />
      <div className="metrics" data-style={style}>
        {metrics.map((m, i) => (
          <div className="metric" key={i}>
            <div className="m-num">
              {str(m.value)}
              {str(m.unit) && <span className="unit">{str(m.unit)}</span>}
            </div>
            <div className="m-cap">{str(m.label)}</div>
            {str(m.sub) && <div className="m-sub">{str(m.sub)}</div>}
          </div>
        ))}
      </div>
    </>
  )
}

function TimelineBlock({ cfg, no }: { cfg: Record<string, unknown>; no: number | null }) {
  const items = arr(cfg.items)
  const direction = str(cfg.direction) || 'vertical'
  return (
    <div className="col">
      <SectionHeader cfg={cfg} no={no} />
      <div className="timeline" data-direction={direction}>
        {items.map((it, i) => (
          <div className={`tl-item${it.done === true ? ' done' : ''}`} key={i}>
            <span className="tl-dot" />
            {str(it.date) && <div className="tl-date">{str(it.date)}</div>}
            <h3 className="tl-title">{str(it.title)}</h3>
            {str(it.description) && <p className="tl-desc">{str(it.description)}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function CodeBlock({ cfg, no }: { cfg: Record<string, unknown>; no: number | null }) {
  const code = str(cfg.code)
  const showLn = cfg.show_line_numbers !== false
  const highlight = new Set(arr<number>(cfg.highlight_lines as unknown[]).map((n) => Number(n)))
  const lines = code.replace(/\n$/, '').split('\n')
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    })
  }

  return (
    <div className="col">
      <SectionHeader cfg={cfg} no={no} />
      <div className="code-block">
        <div className="code-bar">
          <span className="fname">{str(cfg.filename) || 'snippet'}</span>
          <span className="lang">{str(cfg.language) || 'text'}</span>
          <button className="code-copy" onClick={copy}>{copied ? 'copied ✓' : 'copy'}</button>
        </div>
        <pre className="code">
          {lines.map((ln, i) => (
            <span className={`row${highlight.has(i + 1) ? ' hl' : ''}`} key={i}>
              {showLn && <span className="ln">{i + 1}</span>}
              {ln || ' '}
            </span>
          ))}
        </pre>
      </div>
    </div>
  )
}

function videoEmbedUrl(raw: string): { kind: 'iframe' | 'file'; url: string } {
  const yt = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/)
  if (yt) return { kind: 'iframe', url: `https://www.youtube.com/embed/${yt[1]}` }
  const vimeo = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) return { kind: 'iframe', url: `https://player.vimeo.com/video/${vimeo[1]}` }
  return { kind: 'file', url: raw }
}

function VideoBlock({ cfg, no }: { cfg: Record<string, unknown>; no: number | null }) {
  const raw = str(cfg.video_url)
  const caption = str(cfg.caption)
  const embed = raw ? videoEmbedUrl(raw) : null
  return (
    <div className="col">
      <SectionHeader cfg={cfg} no={no} />
      <figure className="video-fig">
        {!embed ? (
          <div className="ph dark video-ph" />
        ) : embed.kind === 'iframe' ? (
          <iframe
            className="video-frame"
            src={embed.url}
            title={caption || 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            className="video-frame"
            src={embed.url}
            controls={cfg.controls !== false}
            muted={cfg.muted === true}
            loop={cfg.loop === true}
          />
        )}
        {caption && <figcaption className="video-cap">{caption}</figcaption>}
      </figure>
    </div>
  )
}

function EmbedBlock({ cfg, no }: { cfg: Record<string, unknown>; no: number | null }) {
  const url = str(cfg.embed_url)
  const provider = str(cfg.provider)
  const source = str(cfg.source_label) || url
  const caption = str(cfg.caption)
  const height = num(cfg.height, 480)
  return (
    <div className="col">
      <SectionHeader cfg={cfg} no={no} />
      <div className="embed-shell">
        <div className="embed-bar">
          <span className="dot" /><span className="dot" /><span className="dot" />
          <span className="src">{source}</span>
          {provider && <span className="prov">{provider}</span>}
        </div>
        {url ? (
          <iframe
            className="embed-frame"
            src={url}
            title={provider || 'Embedded content'}
            style={{ height }}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope"
            allowFullScreen={cfg.allow_fullscreen !== false}
          />
        ) : (
          <div className="ph embed-frame" style={{ height }}><span className="ph-tag">embed</span></div>
        )}
      </div>
      {caption && <p className="video-cap">{caption}</p>}
    </div>
  )
}

function QuoteBlock({ cfg, no }: { cfg: Record<string, unknown>; no: number | null }) {
  const text = str(cfg.text)
  const name = str(cfg.attribution_name)
  const role = str(cfg.attribution_role)
  const style = str(cfg.style)
  return (
    <div className="col">
      <SectionHeader cfg={cfg} no={no} />
      <figure className={`quote-block${style === 'plain' ? ' plain' : ''}`}>
        <blockquote className="q-text">{text}</blockquote>
        {(name || role) && (
          <figcaption className="q-attr">
            {name && <span className="name">{name}</span>}
            {name && role && ' · '}
            {role}
          </figcaption>
        )}
      </figure>
    </div>
  )
}

function ComparisonBlock({ cfg, no }: { cfg: Record<string, unknown>; no: number | null }) {
  return (
    <div className="col">
      <SectionHeader cfg={cfg} no={no} />
      <div className="compare">
        <div className="pane">
          <div className="p-label">{str(cfg.left_label) || 'Before'}</div>
          <div className="p-body">{str(cfg.left_content)}</div>
        </div>
        <div className="pane">
          <div className="p-label">{str(cfg.right_label) || 'After'}</div>
          <div className="p-body">{str(cfg.right_content)}</div>
        </div>
      </div>
    </div>
  )
}

function PollBlock({ cfg, no, blockId }: { cfg: Record<string, unknown>; no: number | null; blockId: string }) {
  const question = str(cfg.question)
  const options = arr<string>(cfg.options as unknown[]).map((o) => String(o))
  const KEY = `pf-poll-${blockId}`
  const [chosen, setChosen] = useState<number | null>(() => {
    try {
      const v = localStorage.getItem(KEY)
      return v != null ? Number(v) : null
    } catch {
      return null
    }
  })
  // Deterministic pseudo-tallies so the bars feel populated (display only).
  const tallies = useMemo(
    () => options.map((o, i) => 12 + ((o.length * 7 + i * 13) % 30)),
    [options],
  )
  const bump = chosen != null ? 1 : 0
  const total = tallies.reduce((a, b) => a + b, 0) + bump

  const vote = (i: number) => {
    if (chosen != null) return
    setChosen(i)
    try { localStorage.setItem(KEY, String(i)) } catch { /* ignore */ }
  }

  return (
    <div className="col">
      <SectionHeader cfg={cfg} no={no} />
      <div className={`poll${chosen != null ? ' voted' : ''}`}>
        <h3 className="poll-q">{question}</h3>
        <div className="poll-meta">{total} votes · choose one</div>
        {options.map((opt, i) => {
          const count = tallies[i] + (chosen === i ? 1 : 0)
          const pct = Math.round((count / total) * 100)
          return (
            <button
              type="button"
              className={`poll-opt${chosen === i ? ' chosen' : ''}`}
              key={i}
              onClick={() => vote(i)}
            >
              <span className="fill" style={{ width: chosen != null ? `${pct}%` : 0 }} />
              <span className="radio" />
              <span className="lbl">{opt}</span>
              <span className="pct">{pct}%</span>
            </button>
          )
        })}
        <div className="poll-hint">Tap an option to vote · your choice is remembered on this device.</div>
      </div>
    </div>
  )
}

function CtaBlock({ cfg }: { cfg: Record<string, unknown> }) {
  return (
    <div className="cta">
      <div className="cta-in">
        <h3>{str(cfg.heading) || 'Get in touch'}</h3>
        {str(cfg.description) && <p>{str(cfg.description)}</p>}
        <div className="cta-btns">
          {str(cfg.primary_label) && (
            <a className="cta-btn fill" href={str(cfg.primary_url) || '#'}>{str(cfg.primary_label)}</a>
          )}
          {str(cfg.secondary_label) && (
            <a className="cta-btn ghost" href={str(cfg.secondary_url) || '#'}>{str(cfg.secondary_label)}</a>
          )}
        </div>
      </div>
    </div>
  )
}

function GalleryBlock({ cfg, no }: { cfg: Record<string, unknown>; no: number | null }) {
  const images = arr(cfg.images)
  const layout = str(cfg.layout) || 'grid'
  const [idx, setIdx] = useState(0)
  const sliding = layout === 'carousel' || layout === 'filmstrip'
  const go = (i: number) => setIdx((i + images.length) % (images.length || 1))

  return (
    <>
      <SectionHeader cfg={cfg} no={no} />
      <div className="gallery-stage" data-layout={layout}>
        <div className="g-viewport">
          <ul
            className="g-track"
            style={sliding ? { transform: `translateX(-${idx * 100}%)` } : undefined}
          >
            {images.map((im, i) => {
              const url = imageUrlOf(im)
              return (
                <li className="g-cell" key={i}>
                  {url ? (
                    <img src={url} alt={str(im.alt) || str(im.caption) || `Image ${i + 1}`} />
                  ) : (
                    <div className="ph"><span className="ph-tag">image {i + 1}</span></div>
                  )}
                  {str(im.caption) && <div className="g-cap">{str(im.caption)}</div>}
                </li>
              )
            })}
          </ul>
        </div>

        {layout === 'carousel' && images.length > 1 && (
          <div className="g-controls">
            <button className="g-arrow" aria-label="Previous" onClick={() => go(idx - 1)}>‹</button>
            <div className="g-dots">
              {images.map((_, i) => (
                <button key={i} className={`g-dot${i === idx ? ' on' : ''}`} aria-label={`Slide ${i + 1}`} onClick={() => go(i)} />
              ))}
            </div>
            <button className="g-arrow" aria-label="Next" onClick={() => go(idx + 1)}>›</button>
          </div>
        )}

        {layout === 'filmstrip' && images.length > 1 && (
          <div className="g-thumbs">
            {images.map((im, i) => {
              const url = imageUrlOf(im)
              return (
                <button key={i} className={`g-thumb${i === idx ? ' on' : ''}`} onClick={() => go(i)}>
                  {url && <img src={url} alt="" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

function FormBlock({ cfg, no }: { cfg: Record<string, unknown>; no: number | null }) {
  const name = str(cfg.form_name) || 'Feedback'
  return (
    <div className="col">
      <SectionHeader cfg={cfg} no={no} />
      <div className="embed-shell">
        <div className="embed-bar">
          <span className="dot" /><span className="dot" /><span className="dot" />
          <span className="src">{name}</span>
          <span className="prov">Form</span>
        </div>
        <div className="ph embed-frame" style={{ height: num(cfg.height, 480) }}>
          <span className="ph-tag">{name} · embedded form</span>
        </div>
      </div>
    </div>
  )
}

// ── dispatcher ──────────────────────────────────────────────────────────────────

export function BlockRenderer({
  block,
  no,
  fig,
}: {
  block: PublicBlock
  no: number | null
  fig: number
}) {
  const cfg = block.config ?? {}
  switch (block.block_type) {
    case 'hero':       return <HeroBlock cfg={cfg} />
    case 'text':       return <TextBlock cfg={cfg} no={no} />
    case 'image':      return <ImageBlock cfg={cfg} no={no} fig={fig} />
    case 'stats':      return <StatsBlock cfg={cfg} no={no} />
    case 'timeline':   return <TimelineBlock cfg={cfg} no={no} />
    case 'code':       return <CodeBlock cfg={cfg} no={no} />
    case 'video':      return <VideoBlock cfg={cfg} no={no} />
    case 'embed':      return <EmbedBlock cfg={cfg} no={no} />
    case 'quote':      return <QuoteBlock cfg={cfg} no={no} />
    case 'comparison': return <ComparisonBlock cfg={cfg} no={no} />
    case 'poll':       return <PollBlock cfg={cfg} no={no} blockId={block.id} />
    case 'gallery':    return <GalleryBlock cfg={cfg} no={no} />
    case 'cta':        return <CtaBlock cfg={cfg} />
    case 'form':       return <FormBlock cfg={cfg} no={no} />
    default:           return null
  }
}

// Blocks rendered full-bleed (no reading column, alternating band handled by page).
export const FULL_BLEED = new Set(['hero', 'stats', 'gallery', 'cta'])
