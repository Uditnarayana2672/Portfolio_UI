/**
 * renderProjectDetail — builds the full public "Project Detail (Dark)" page as a
 * standalone HTML document string, populated from a live ProjectDetail.
 *
 * Rendered inside an isolated <iframe srcDoc> in the preview pane so the dark
 * editorial theme (global body/:root rules) and interactive JS (poll voting,
 * gallery carousel/filmstrip) run without colliding with the builder's UI.
 *
 * Mirrors `Project Detail (Dark).html`. Block configs are the snake_case shapes
 * returned by GET /admin/projects/{id} (see projectApi.toBackendConfig).
 */
import type { ProjectDetail } from '../api/projectApi'

type Dict = Record<string, unknown>

// ── helpers ──────────────────────────────────────────────────────────────────
function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function attr(v: unknown): string {
  return esc(v)
}

function s(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function yearOf(p: ProjectDetail): string {
  const iso = p.published_at || p.created_at
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : String(d.getFullYear())
}

function metaStr(p: ProjectDetail, key: string): string {
  const top = (p as unknown as Dict)[key]
  if (typeof top === 'string' && top.trim()) return top
  const m = (p.meta as Dict | undefined)?.[key]
  return typeof m === 'string' ? m : ''
}

// A meta value may fold a secondary/muted line via a newline or " · ".
// Renders line 1 as the main value and any remainder as a muted sub line.
function twoLine(val: string): string {
  const parts = val.includes('\n') ? val.split('\n') : val.split(' · ')
  const main = esc(parts[0].trim())
  const sub = parts.slice(1).join(' · ').trim()
  return sub ? `${main}<br /><span class="sub">${esc(sub)}</span>` : main
}

// ── project header ───────────────────────────────────────────────────────────
function renderHeader(p: ProjectDetail): string {
  const category = metaStr(p, 'category')
  const year = yearOf(p)
  const kicker = [category, year].filter(Boolean).join(' · ')

  const role = metaStr(p, 'role')
  const timeline = metaStr(p, 'project_timeline')
  const displayStatus = metaStr(p, 'display_status')
  const recognition = metaStr(p, 'recognition')

  const metaItems: string[] = []
  if (role) {
    metaItems.push(
      `<div class="m-item"><div class="m-label">Role</div><div class="m-val">${twoLine(role)}</div></div>`,
    )
  }
  if (timeline) {
    metaItems.push(
      `<div class="m-item"><div class="m-label">Timeline</div><div class="m-val">${twoLine(timeline)}</div></div>`,
    )
  }
  if (displayStatus) {
    metaItems.push(
      `<div class="m-item"><div class="m-label">Status</div><div class="m-val">${twoLine(displayStatus)}</div></div>`,
    )
  }
  if (p.demo_url || p.github_url) {
    const links: string[] = []
    if (p.demo_url) links.push(`<a class="ext-link primary" href="${attr(p.demo_url)}" target="_blank" rel="noreferrer">Live demo <span class="arr">↗</span></a>`)
    if (p.github_url) links.push(`<a class="ext-link" href="${attr(p.github_url)}" target="_blank" rel="noreferrer">GitHub <span class="arr">↗</span></a>`)
    metaItems.push(
      `<div class="m-item"><div class="m-label">Links</div><div class="m-val links-row">${links.join('')}</div></div>`,
    )
  }
  if (p.tech_stack?.length) {
    const tags = p.tech_stack.map(t => `<span class="tag">${esc(t)}</span>`).join('')
    metaItems.push(
      `<div class="m-item span2"><div class="m-label">Stack</div><div class="stack-tags">${tags}</div></div>`,
    )
  }
  if (recognition) {
    metaItems.push(
      `<div class="m-item span2"><div class="m-label">Recognition</div><div class="m-val">${esc(recognition)}</div></div>`,
    )
  }

  return `
  <section class="wrap phead">
    ${kicker ? `<div class="kicker">${esc(kicker)}</div>` : ''}
    <h1>${esc(p.title || 'Untitled project')}</h1>
    ${p.excerpt ? `<p class="lede">${esc(p.excerpt)}</p>` : ''}
    ${metaItems.length ? `<div class="meta">${metaItems.join('')}</div>` : ''}
  </section>`
}

// ── section eyebrow ──────────────────────────────────────────────────────────
const TYPE_LABEL: Record<string, string> = {
  text: 'Overview', image: 'Image', gallery: 'Gallery', video: 'Video',
  code: 'Code', timeline: 'Timeline', stats: 'Impact', poll: 'Your call',
  quote: 'Quote', comparison: 'Comparison', embed: 'Embed',
}

function eyebrow(c: Dict, blockType: string, no: number): string {
  const label = s(c.eyebrow) || TYPE_LABEL[blockType] || blockType
  const nn = String(no).padStart(2, '0')
  return `<p class="eyebrow"><span class="no">${nn}</span> ${esc(label)}</p>`
}

function headingH2(c: Dict): string {
  const h = s(c.heading)
  return h ? `<h2 class="block-h">${esc(h)}</h2>` : ''
}

// ── individual blocks ────────────────────────────────────────────────────────
function renderHero(c: Dict): string {
  const img = s(c.background_image_url)
  const caption = s(c.caption)
  const heading = s(c.heading)
  const media = img
    ? `<img src="${attr(img)}" alt="${attr(heading)}" style="width:100%;aspect-ratio:16/7;object-fit:cover;border-radius:3px" />`
    : `<div class="ph hero-ph"><span class="ph-tag">hero image — add a background image</span></div>`
  return `
  <section class="wrap section" style="padding-top:0">
    <figure class="hero-fig">
      ${media}
      ${caption ? `<figcaption class="hero-cap">${esc(caption)}</figcaption>` : ''}
    </figure>
  </section>`
}

function renderText(c: Dict, no: number): string {
  const style = s(c.style) || 'standard'
  const content = s(c.content) || '<p>(empty text block)</p>'
  return `
  <section class="wrap section" style="padding-top:0">
    <div class="col">
      ${eyebrow(c, 'text', no)}
      <div class="prose" data-style="${attr(style)}">${content}</div>
    </div>
  </section>`
}

function renderImage(c: Dict, no: number): string {
  const url = s(c.image_url)
  const caption = s(c.caption)
  const media = url
    ? `<img src="${attr(url)}" alt="${attr(c.alt_text)}" style="width:100%;border-radius:3px" />`
    : `<div class="ph"><span class="ph-tag">image — no url set</span></div>`
  return `
  <section class="wrap section">
    <div class="col">
      ${eyebrow(c, 'image', no)}
      ${headingH2(c)}
      <figure class="img-block">
        ${media}
        ${caption ? `<figcaption><span class="fc-no">fig</span><span>${esc(caption)}</span></figcaption>` : ''}
      </figure>
    </div>
  </section>`
}

function renderStats(c: Dict, no: number): string {
  const metrics = Array.isArray(c.metrics) ? (c.metrics as Dict[]) : []
  const style = s(c.style) || 'highlighted'
  const cells = metrics.map(m => {
    const unit = s(m.unit)
    return `
        <div class="metric">
          <div class="m-num">${esc(m.value)}${unit ? `<span class="unit">${esc(unit)}</span>` : ''}</div>
          <div class="m-cap">${esc(m.label)}</div>
          ${s(m.sub_label) ? `<div class="m-sub">${esc(m.sub_label)}</div>` : ''}
        </div>`
  }).join('')
  return `
  <section class="band section">
    <div class="wrap">
      ${eyebrow(c, 'stats', no)}
      ${headingH2(c)}
      <div class="metrics" data-style="${attr(style)}">${cells}</div>
    </div>
  </section>`
}

function renderTimeline(c: Dict, no: number): string {
  const items = Array.isArray(c.items) ? (c.items as Dict[]) : []
  const direction = s(c.direction) || 'vertical'
  const rows = items.map(it => `
          <div class="tl-item${it.completed ? ' done' : ''}">
            <span class="tl-dot"></span>
            <div class="tl-date">${esc(it.date)}</div>
            <h3 class="tl-title">${esc(it.title)}</h3>
            ${s(it.description) ? `<p class="tl-desc">${esc(it.description)}</p>` : ''}
          </div>`).join('')
  return `
  <section class="band section">
    <div class="wrap"><div class="col">
      ${eyebrow(c, 'timeline', no)}
      ${headingH2(c)}
      <div class="timeline" data-direction="${attr(direction)}">${rows}</div>
    </div></div>
  </section>`
}

function renderCode(c: Dict, no: number): string {
  const code = s(c.code)
  const lang = s(c.language) || 'text'
  const filename = s(c.filename)
  const showLn = c.show_line_numbers !== false
  const hl = new Set((Array.isArray(c.highlight_lines) ? c.highlight_lines : []).map(Number))
  const lines = code.split('\n')
  const body = lines.map((line, i) => {
    const n = i + 1
    const lnSpan = showLn ? `<span class="ln">${n}</span>` : ''
    const row = `${lnSpan}${esc(line) || ' '}`
    return hl.has(n) ? `<span class="hl">${row}</span>` : row
  }).join('\n')
  return `
  <section class="wrap section">
    <div class="col">
      ${eyebrow(c, 'code', no)}
      ${headingH2(c)}
      <div class="code-block">
        <div class="code-bar">
          <span class="fname">${esc(filename || 'snippet')}</span>
          <span class="lang">${esc(lang)}</span>
        </div>
<pre class="code">${body}</pre>
      </div>
    </div>
  </section>`
}

function renderGallery(c: Dict, no: number): string {
  const images = Array.isArray(c.images) ? (c.images as Dict[]) : []
  const layout = s(c.layout) || 'grid'
  const cells = images.map((im, i) => {
    const url = s(im.url)
    const media = url
      ? `<img class="ph" style="aspect-ratio:4/3;object-fit:cover;border-radius:3px" src="${attr(url)}" alt="${attr(im.alt)}" />`
      : `<div class="ph"><span class="ph-tag">image ${i + 1}</span></div>`
    return `
            <li class="g-cell">
              ${media}
              ${s(im.caption) ? `<div class="g-cap">${esc(im.caption)}</div>` : ''}
            </li>`
  }).join('')
  return `
  <section class="band section">
    <div class="wrap">
      ${eyebrow(c, 'gallery', no)}
      ${headingH2(c)}
      <div class="gallery-stage" data-layout="${attr(layout)}">
        <div class="g-viewport"><ul class="g-track">${cells}</ul></div>
        <div class="g-controls">
          <button class="g-arrow prev" aria-label="Previous">‹</button>
          <div class="g-dots"></div>
          <button class="g-arrow next" aria-label="Next">›</button>
        </div>
        <div class="g-thumbs"></div>
      </div>
    </div>
  </section>`
}

function renderVideo(c: Dict, no: number): string {
  const url = s(c.video_url)
  const caption = s(c.caption)
  const thumb = s(c.thumbnail_url)
  let media: string
  if (/youtube|youtu\.be|vimeo|player\./.test(url)) {
    media = `<iframe class="embed-ph" style="width:100%;aspect-ratio:16/9;border:0;border-radius:4px" src="${attr(url)}" allowfullscreen></iframe>`
  } else if (url) {
    media = `<video class="video-ph" style="width:100%;aspect-ratio:16/9;border-radius:4px" src="${attr(url)}" controls${thumb ? ` poster="${attr(thumb)}"` : ''}></video>`
  } else {
    media = `<div class="ph dark video-ph"><div class="play"></div></div>`
  }
  return `
  <section class="wrap section">
    <div class="col">
      ${eyebrow(c, 'video', no)}
      ${headingH2(c)}
      <figure class="video-fig">
        ${media}
        ${caption ? `<figcaption class="video-cap">▶ ${esc(caption)}</figcaption>` : ''}
      </figure>
    </div>
  </section>`
}

function renderEmbed(c: Dict, no: number): string {
  const url = s(c.embed_url)
  const provider = s(c.provider)
  const src = s(c.source_label) || url
  const caption = s(c.caption)
  const media = url
    ? `<iframe class="embed-ph" style="width:100%;aspect-ratio:16/9;border:0" src="${attr(url)}" allowfullscreen></iframe>`
    : `<div class="ph embed-ph"><span class="ph-tag">embed — no url set</span></div>`
  return `
  <section class="wrap section" style="padding-top:0">
    <div class="col">
      ${eyebrow(c, 'embed', no)}
      ${headingH2(c)}
      <div class="embed-shell">
        <div class="embed-bar">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          ${src ? `<span class="src">${esc(src)}</span>` : ''}
          ${provider ? `<span class="prov">${esc(provider)}</span>` : ''}
        </div>
        ${media}
      </div>
      ${caption ? `<p class="video-cap" style="margin-top:12px">${esc(caption)}</p>` : ''}
    </div>
  </section>`
}

function renderPoll(c: Dict): string {
  const question = s(c.question)
  const options = Array.isArray(c.options) ? (c.options as string[]) : []
  const opts = options.map((opt, i) => {
    // Seed decreasing pseudo-counts so bars aren't all equal on first vote.
    const base = Math.max(4, 40 - i * 9)
    return `
          <div class="poll-opt" data-key="${i}" data-base="${base}">
            <span class="fill"></span>
            <span class="radio"></span>
            <span class="lbl">${esc(opt)}</span>
            <span class="pct">0%</span>
          </div>`
  }).join('')
  return `
  <section class="band section">
    <div class="wrap"><div class="col">
      <p class="eyebrow"><span class="no">◆</span> Your call</p>
      <div class="poll">
        <h3 class="poll-q">${esc(question)}</h3>
        <div class="poll-meta">choose one</div>
        ${opts}
        <div class="poll-hint">Tap an option to vote.</div>
      </div>
    </div></div>
  </section>`
}

function renderQuote(c: Dict, no: number): string {
  const text = s(c.text)
  const name = s(c.attribution_name)
  const role = s(c.attribution_role)
  const attrib = [name, role].filter(Boolean).join(' · ')
  return `
  <section class="wrap section">
    <div class="col">
      ${eyebrow(c, 'quote', no)}
      <blockquote class="pull" style="max-width:none">${esc(text)}</blockquote>
      ${attrib ? `<p class="video-cap">— ${esc(attrib)}</p>` : ''}
    </div>
  </section>`
}

function renderComparison(c: Dict, no: number): string {
  return `
  <section class="wrap section">
    <div class="col">
      ${eyebrow(c, 'comparison', no)}
      ${headingH2(c)}
      <div class="metrics" data-style="card" style="grid-template-columns:repeat(2,1fr)">
        <div class="metric">
          <div class="m-sub" style="color:var(--accent);margin-bottom:8px">${esc(c.left_label || 'Before')}</div>
          <div class="m-cap">${esc(c.left_content)}</div>
        </div>
        <div class="metric">
          <div class="m-sub" style="color:var(--accent);margin-bottom:8px">${esc(c.right_label || 'After')}</div>
          <div class="m-cap">${esc(c.right_content)}</div>
        </div>
      </div>
    </div>
  </section>`
}

function renderCta(c: Dict): string {
  const heading = s(c.heading)
  const desc = s(c.description)
  const pLabel = s(c.primary_label)
  const pUrl = s(c.primary_url)
  const sLabel = s(c.secondary_label)
  const sUrl = s(c.secondary_url)
  const btns: string[] = []
  if (pLabel) btns.push(`<a class="cta-btn fill" href="${attr(pUrl || '#')}">${esc(pLabel)} →</a>`)
  if (sLabel) btns.push(`<a class="cta-btn ghost" href="${attr(sUrl || '#')}">${esc(sLabel)}</a>`)
  return `
  <section class="wrap section">
    <div class="cta"><div class="cta-in">
      <h3>${esc(heading || 'Get in touch')}</h3>
      ${desc ? `<p>${esc(desc)}</p>` : ''}
      ${btns.length ? `<div class="cta-btns">${btns.join('')}</div>` : ''}
    </div></div>
  </section>`
}

function renderForm(c: Dict, no: number): string {
  const name = s(c.form_name)
  return `
  <section class="wrap section">
    <div class="col">
      ${eyebrow(c, 'embed', no)}
      <div class="embed-shell">
        <div class="embed-bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span>
          <span class="src">${esc(name || 'form')}</span><span class="prov">Form</span></div>
        <div class="ph embed-ph"><span class="ph-tag">form embed (${esc(c.form_id)})</span></div>
      </div>
    </div>
  </section>`
}

// Section-header block types get an auto-incrementing eyebrow number.
const NUMBERED = new Set([
  'text', 'image', 'gallery', 'video', 'code', 'timeline', 'stats', 'quote', 'comparison', 'embed', 'form',
])

function renderBlock(blockType: string, c: Dict, no: number): string {
  switch (blockType) {
    case 'hero':       return renderHero(c)
    case 'text':       return renderText(c, no)
    case 'image':      return renderImage(c, no)
    case 'stats':      return renderStats(c, no)
    case 'timeline':   return renderTimeline(c, no)
    case 'code':       return renderCode(c, no)
    case 'gallery':    return renderGallery(c, no)
    case 'video':      return renderVideo(c, no)
    case 'embed':      return renderEmbed(c, no)
    case 'poll':       return renderPoll(c)
    case 'quote':      return renderQuote(c, no)
    case 'comparison': return renderComparison(c, no)
    case 'cta':        return renderCta(c)
    case 'form':       return renderForm(c, no)
    default:           return ''
  }
}

// ── document assembly ────────────────────────────────────────────────────────
export function buildProjectDetailHtml(p: ProjectDetail): string {
  const sorted = p.blocks.slice().sort((a, b) => a.position - b.position)

  let sectionNo = 0
  const body = sorted.map(b => {
    if (NUMBERED.has(b.block_type)) sectionNo += 1
    return renderBlock(b.block_type, b.config ?? {}, sectionNo)
  }).join('\n')

  const empty = sorted.length === 0
    ? `<section class="wrap section"><div class="col"><div class="ph" style="min-height:180px"><span class="ph-tag">No content blocks yet — add blocks in the editor to see them here.</span></div></div></section>`
    : ''

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(p.title)} — Preview</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
<style>${PAGE_CSS}</style>
</head>
<body>
  <header class="nav">
    <div class="wrap nav-in">
      <a class="brand" href="#"><span class="mono">UN</span> Udit&nbsp;Narayana</a>
      <nav class="nav-links">
        <a href="#">Work</a><a href="#">Writing</a><a href="#">About</a>
        <a class="cta" href="#">Contact</a>
      </nav>
    </div>
  </header>
  <div class="backbar"><div class="wrap"><a href="#">← All projects</a></div></div>
  ${renderHeader(p)}
  ${body}
  ${empty}
  <footer class="footer">
    <div class="wrap foot-bottom"><span>© ${yearOf(p) || ''} Udit Narayana</span><span class="sig">Preview</span></div>
  </footer>
  <script>${PAGE_JS}</script>
</body>
</html>`
}

// ── page CSS (verbatim from Project Detail (Dark).html) ──────────────────────
const PAGE_CSS = `
  :root {
    --paper:#26241F; --paper-2:#201E1A; --paper-3:#34302A;
    --ink:#F0EEE6; --ink-2:#C7C2B6; --muted:#948E80;
    --line:#39352E; --line-2:#4B463C;
    --accent:#D9805B; --accent-d:#E4926E; --accent-soft:#3A2A22; --ember:#D9805B;
    --serif:"Newsreader",Georgia,"Times New Roman",serif;
    --sans:"IBM Plex Sans",system-ui,-apple-system,sans-serif;
    --mono:"IBM Plex Mono",ui-monospace,"SFMono-Regular",monospace;
    --measure:720px; --wide:1120px; --gut:clamp(20px,5vw,48px);
  }
  * { box-sizing:border-box; }
  html { -webkit-text-size-adjust:100%; scroll-behavior:smooth; }
  body { margin:0; background:var(--paper); color:var(--ink); font-family:var(--sans);
    font-size:17px; line-height:1.5; -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility; }
  img { max-width:100%; display:block; }
  a { color:inherit; }
  .wrap { width:100%; max-width:var(--wide); margin-inline:auto; padding-inline:var(--gut); }
  .col { width:100%; max-width:var(--measure); margin-inline:auto; }
  .section { padding-block:clamp(40px,7vw,80px); }
  .band { background:var(--paper-2); border-block:1px solid var(--line); }
  .eyebrow { font-family:var(--mono); font-size:12px; letter-spacing:0.18em; text-transform:uppercase;
    color:var(--muted); display:flex; align-items:center; gap:12px; margin:0 0 18px; }
  .eyebrow::before { content:""; width:26px; height:1px; background:var(--line-2); }
  .eyebrow .no { color:var(--accent); }
  h2.block-h { font-family:var(--serif); font-weight:500; font-size:clamp(26px,4vw,38px);
    line-height:1.12; letter-spacing:-0.01em; margin:0 0 22px; }
  .nav { position:sticky; top:0; z-index:40; background:color-mix(in srgb,var(--paper) 88%,transparent);
    backdrop-filter:blur(8px); border-bottom:1px solid var(--line); }
  .nav-in { display:flex; align-items:center; gap:16px; height:60px; }
  .brand { display:flex; align-items:center; gap:11px; text-decoration:none; color:var(--ink);
    font-family:var(--serif); font-size:20px; font-weight:600; letter-spacing:-0.01em; }
  .brand .mono { width:30px; height:30px; flex:none; border:1.5px solid var(--ink); display:grid;
    place-items:center; font-family:var(--mono); font-size:13px; font-weight:500; border-radius:50%; }
  .nav-links { margin-left:auto; display:flex; align-items:center; gap:26px; }
  .nav-links a { text-decoration:none; color:var(--ink-2); font-size:14.5px; padding:4px 0; }
  .nav-links a:hover { color:var(--ink); }
  .nav-links a.cta { color:var(--paper); background:var(--accent); padding:8px 16px; border-radius:2px; }
  .backbar { border-bottom:1px solid var(--line); }
  .backbar a { display:inline-flex; align-items:center; gap:8px; text-decoration:none; color:var(--muted);
    font-family:var(--mono); font-size:12px; letter-spacing:0.08em; text-transform:uppercase; padding:13px 0; }
  .phead { padding-top:clamp(34px,6vw,64px); padding-bottom:clamp(28px,4vw,44px); }
  .phead .kicker { font-family:var(--mono); font-size:12.5px; letter-spacing:0.16em; text-transform:uppercase;
    color:var(--accent); margin:0 0 20px; }
  .phead h1 { font-family:var(--serif); font-weight:500; font-size:clamp(38px,7vw,74px); line-height:1.04;
    letter-spacing:-0.02em; margin:0 0 20px; max-width:16ch; }
  .phead .lede { font-family:var(--serif); font-weight:400; font-size:clamp(19px,2.4vw,24px); line-height:1.5;
    color:var(--ink-2); max-width:60ch; margin:0; }
  .meta { margin-top:clamp(30px,4vw,44px); display:grid; gap:24px 40px;
    grid-template-columns:repeat(2,minmax(0,1fr)); border-top:1px solid var(--line); padding-top:28px; }
  .meta .m-item .m-label { font-family:var(--mono); font-size:11px; letter-spacing:0.14em; text-transform:uppercase;
    color:var(--muted); margin-bottom:7px; }
  .meta .m-item .m-val { font-size:15.5px; color:var(--ink); line-height:1.45; }
  .meta .m-item .m-val .sub { color:var(--muted); }
  .links-row { display:flex; flex-wrap:wrap; gap:10px; }
  .ext-link { display:inline-flex; align-items:center; gap:8px; text-decoration:none; font-size:14.5px;
    color:var(--ink); border:1px solid var(--line-2); border-radius:2px; padding:8px 13px; background:var(--paper); }
  .ext-link:hover { border-color:var(--ink); background:var(--paper-2); }
  .ext-link.primary { background:var(--accent); border-color:var(--accent); color:var(--paper); }
  .ext-link .arr { font-family:var(--mono); }
  .stack-tags { display:flex; flex-wrap:wrap; gap:7px; margin-top:2px; }
  .tag { font-family:var(--mono); font-size:12px; color:var(--ink-2); background:var(--paper-2);
    border:1px solid var(--line); border-radius:2px; padding:4px 9px; }
  .ph { position:relative; width:100%;
    background:repeating-linear-gradient(45deg,transparent 0 11px,rgba(255,255,255,0.04) 11px 12px),var(--paper-3);
    border:1px solid var(--line-2); display:grid; place-items:center; overflow:hidden; }
  .ph .ph-tag { font-family:var(--mono); font-size:12px; color:var(--muted); background:var(--paper);
    border:1px solid var(--line-2); padding:5px 11px; border-radius:2px; text-align:center; max-width:80%; }
  .ph.dark { background:repeating-linear-gradient(45deg,transparent 0 11px,rgba(255,255,255,0.05) 11px 12px),#2B2823;
    border-color:#454036; }
  .hero-fig { margin:0; }
  .hero-ph { aspect-ratio:16/7; min-height:280px; }
  .hero-cap { font-family:var(--mono); font-size:12px; color:var(--muted); padding-top:12px; }
  .prose p { font-size:clamp(17px,1.25vw,19px); line-height:1.62; color:var(--ink-2); margin:0 0 1.1em; }
  .prose p:last-child { margin-bottom:0; }
  .prose strong { color:var(--ink); font-weight:600; }
  .prose .pull, .prose blockquote.pull { font-family:var(--serif); font-weight:400; font-style:italic;
    font-size:clamp(22px,3vw,30px); line-height:1.36; color:var(--ink); border-left:2px solid var(--accent);
    padding-left:clamp(18px,3vw,28px); margin:clamp(28px,4vw,40px) 0; max-width:26ch; }
  .prose[data-style="dropcap"] > p:first-of-type::first-letter { font-family:var(--serif); font-weight:600;
    float:left; font-size:3.4em; line-height:0.82; padding:6px 12px 0 0; color:var(--ink); }
  .prose[data-style="lead"] > p:first-of-type { font-family:var(--serif); font-size:clamp(21px,2.6vw,27px);
    line-height:1.45; color:var(--ink); }
  .prose[data-style="twocol"] { column-count:2; column-gap:38px; }
  .prose[data-style="twocol"] > .pull { column-span:all; }
  .prose[data-style="twocol"] > p { break-inside:avoid; }
  @media (max-width:600px) { .prose[data-style="twocol"] { column-count:1; } }
  .metrics { display:grid; gap:1px; background:var(--line); border:1px solid var(--line);
    grid-template-columns:repeat(2,1fr); }
  .metric { background:var(--paper); padding:clamp(20px,3vw,30px); }
  .metric .m-num { font-family:var(--serif); font-weight:500; font-size:clamp(38px,5.5vw,56px); line-height:1;
    letter-spacing:-0.02em; color:var(--ink); display:flex; align-items:baseline; gap:4px; }
  .metric .m-num .unit { font-size:0.5em; color:var(--accent); font-weight:500; }
  .metric .m-cap { margin-top:12px; font-size:14.5px; color:var(--ink-2); line-height:1.4; }
  .metric .m-sub { font-family:var(--mono); font-size:11.5px; color:var(--muted); margin-top:5px; }
  .metrics[data-style="card"] { background:transparent; border:none; gap:14px; }
  .metrics[data-style="card"] .metric { border:1px solid var(--line-2); border-top:3px solid var(--accent); border-radius:4px; }
  .metrics[data-style="minimal"] { background:transparent; border:none; gap:26px 18px; }
  .metrics[data-style="minimal"] .metric { background:transparent; padding:6px 0; }
  .metrics[data-style="minimal"] .m-cap { color:var(--ink); }
  figure.img-block { margin:0; }
  figure.img-block .ph { aspect-ratio:16/9; border-radius:3px; }
  figure.img-block figcaption { font-size:14px; color:var(--muted); margin-top:12px; line-height:1.5;
    display:flex; gap:10px; }
  figure.img-block figcaption .fc-no { font-family:var(--mono); color:var(--accent); flex:none; }
  .timeline { position:relative; margin-top:8px; }
  .timeline::before { content:""; position:absolute; left:7px; top:6px; bottom:6px; width:1.5px; background:var(--line-2); }
  .tl-item { position:relative; padding-left:38px; padding-bottom:34px; }
  .tl-item:last-child { padding-bottom:0; }
  .tl-dot { position:absolute; left:0; top:4px; width:15px; height:15px; border-radius:50%;
    background:var(--paper); border:2px solid var(--accent); }
  .tl-item.done .tl-dot { background:var(--accent); }
  .tl-date { font-family:var(--mono); font-size:12px; letter-spacing:0.06em; color:var(--accent);
    text-transform:uppercase; margin-bottom:5px; }
  .tl-title { font-family:var(--serif); font-size:21px; font-weight:500; margin:0 0 6px; }
  .tl-desc { font-size:15px; color:var(--ink-2); line-height:1.55; margin:0; max-width:56ch; }
  .timeline[data-direction="horizontal"] { display:flex; gap:0; overflow-x:auto; padding-bottom:14px; }
  .timeline[data-direction="horizontal"]::before { display:none; }
  .timeline[data-direction="horizontal"] .tl-item { padding:30px 26px 0 0; min-width:230px; flex:1 0 230px; }
  .timeline[data-direction="horizontal"] .tl-item::after { content:""; position:absolute; left:16px; right:0;
    top:6px; height:1.5px; background:var(--line-2); }
  .timeline[data-direction="horizontal"] .tl-item:last-child::after { display:none; }
  .timeline[data-direction="horizontal"] .tl-dot { left:0; top:0; }
  .code-block { border:1px solid #454036; border-radius:4px; overflow:hidden; background:#26231F; }
  .code-bar { display:flex; align-items:center; gap:10px; padding:11px 16px; background:#1E1C18; border-bottom:1px solid #454036; }
  .code-bar .fname { font-family:var(--mono); font-size:13px; color:#DAD3C5; }
  .code-bar .lang { margin-left:auto; font-family:var(--mono); font-size:11px; letter-spacing:0.1em;
    text-transform:uppercase; color:#9D9486; border:1px solid #4C463B; padding:2px 8px; border-radius:2px; }
  pre.code { margin:0; padding:18px; overflow-x:auto; font-family:var(--mono); font-size:13.5px; line-height:1.7; color:#DAD3C5; white-space:pre; }
  pre.code .ln { display:inline-block; width:2.5em; color:#6A6354; user-select:none; }
  pre.code .hl { display:block; background:rgba(193,95,60,0.12); margin-inline:-18px; padding-inline:18px; }
  .gallery-stage { position:relative; }
  .g-viewport { width:100%; }
  .g-track { list-style:none; margin:0; padding:0; }
  .g-cell { margin:0; }
  .g-cell .ph { aspect-ratio:4/3; border-radius:3px; }
  .g-cell .g-cap { font-family:var(--mono); font-size:11.5px; color:var(--muted); margin-top:8px; }
  .gallery-stage[data-layout="grid"] .g-track { display:grid; gap:16px; grid-template-columns:1fr; transform:none; }
  .gallery-stage[data-layout="carousel"] .g-viewport,
  .gallery-stage[data-layout="filmstrip"] .g-viewport { overflow:hidden; }
  .gallery-stage[data-layout="carousel"] .g-track,
  .gallery-stage[data-layout="filmstrip"] .g-track { display:flex; transform:translateX(calc(var(--idx,0) * -100%));
    transition:transform .45s cubic-bezier(.2,.7,.3,1); }
  .gallery-stage[data-layout="carousel"] .g-cell,
  .gallery-stage[data-layout="filmstrip"] .g-cell { min-width:100%; flex:none; }
  .gallery-stage[data-layout="carousel"] .g-cell .ph,
  .gallery-stage[data-layout="filmstrip"] .g-cell .ph { aspect-ratio:16/9; }
  .g-controls { display:none; align-items:center; justify-content:center; gap:18px; margin-top:18px; }
  .g-thumbs { display:none; gap:9px; flex-wrap:wrap; margin-top:14px; }
  .gallery-stage[data-layout="carousel"] .g-controls { display:flex; }
  .gallery-stage[data-layout="filmstrip"] .g-thumbs { display:flex; }
  .g-arrow { width:40px; height:40px; flex:none; border-radius:50%; border:1px solid var(--line-2);
    background:var(--paper); font-size:19px; line-height:1; color:var(--ink); cursor:pointer; display:grid; place-items:center; }
  .g-arrow:hover { border-color:var(--accent); color:var(--accent); }
  .g-dots { display:flex; gap:9px; }
  .g-dot { width:8px; height:8px; padding:0; border-radius:50%; border:1px solid var(--line-2); background:transparent; cursor:pointer; }
  .g-dot.on { background:var(--accent); border-color:var(--accent); }
  .g-thumb { width:88px; height:58px; flex:none; cursor:pointer; border:1px solid var(--line-2); border-radius:2px;
    background:repeating-linear-gradient(45deg,transparent 0 8px,rgba(255,255,255,0.05) 8px 9px),var(--paper-3);
    font-family:var(--mono); font-size:12px; color:var(--muted); display:grid; place-items:center; }
  .g-thumb.on { border-color:var(--accent); box-shadow:0 0 0 1px var(--accent); color:var(--accent); }
  .video-fig { margin:0; }
  .video-ph { aspect-ratio:16/9; border-radius:4px; cursor:pointer; }
  .play { width:74px; height:74px; border-radius:50%; background:rgba(251,250,246,0.92);
    border:1px solid var(--line-2); display:grid; place-items:center; }
  .play::after { content:""; width:0; height:0; margin-left:5px; border-left:20px solid var(--accent);
    border-top:13px solid transparent; border-bottom:13px solid transparent; }
  .video-cap { font-family:var(--mono); font-size:12px; color:var(--muted); margin-top:12px; }
  .embed-shell { border:1px solid var(--line-2); border-radius:5px; overflow:hidden; background:var(--paper); }
  .embed-bar { display:flex; align-items:center; gap:9px; padding:10px 14px; background:var(--paper-2); border-bottom:1px solid var(--line); }
  .embed-bar .dot { width:11px; height:11px; border-radius:50%; background:var(--line-2); }
  .embed-bar .src { font-family:var(--mono); font-size:12px; color:var(--muted); margin-left:6px; }
  .embed-bar .prov { margin-left:auto; font-family:var(--mono); font-size:10.5px; letter-spacing:0.1em;
    text-transform:uppercase; color:var(--accent); border:1px solid var(--line-2); padding:2px 8px; border-radius:2px; }
  .embed-ph { aspect-ratio:16/9; border:none; }
  .poll { border:1px solid var(--line-2); border-radius:5px; background:var(--paper); padding:clamp(22px,3vw,30px); }
  .poll .poll-q { font-family:var(--serif); font-size:clamp(20px,2.6vw,26px); font-weight:500; margin:0 0 4px; }
  .poll .poll-meta { font-family:var(--mono); font-size:11.5px; color:var(--muted); margin-bottom:20px; }
  .poll-opt { position:relative; display:flex; align-items:center; gap:14px; border:1px solid var(--line-2);
    border-radius:3px; padding:14px 16px; margin-bottom:10px; cursor:pointer; overflow:hidden; background:var(--paper); }
  .poll-opt:hover { border-color:var(--accent); }
  .poll-opt .fill { position:absolute; inset:0 auto 0 0; width:0; background:var(--accent-soft);
    transition:width .6s cubic-bezier(.2,.7,.3,1); z-index:0; }
  .poll-opt .lbl, .poll-opt .pct, .poll-opt .radio { position:relative; z-index:1; }
  .poll-opt .radio { width:18px; height:18px; border-radius:50%; border:1.5px solid var(--line-2); flex:none; }
  .poll-opt .lbl { font-size:15.5px; color:var(--ink); }
  .poll-opt .pct { margin-left:auto; font-family:var(--mono); font-size:13px; color:var(--muted); opacity:0; transition:opacity .3s; }
  .poll.voted .poll-opt { cursor:default; }
  .poll.voted .poll-opt .pct { opacity:1; }
  .poll.voted .poll-opt.chosen { border-color:var(--accent); }
  .poll.voted .poll-opt.chosen .radio { border-color:var(--accent); background:var(--accent); box-shadow:inset 0 0 0 3px var(--paper); }
  .poll.voted .poll-opt.chosen .pct { color:var(--accent); }
  .poll-hint { font-family:var(--mono); font-size:11.5px; color:var(--muted); margin-top:6px; }
  .cta { background:#191611; color:var(--ink); border-radius:6px; border:1px solid var(--line-2);
    padding:clamp(34px,6vw,64px) clamp(26px,5vw,56px); position:relative; overflow:hidden; }
  .cta::after { content:""; position:absolute; inset:0; pointer-events:none;
    background:repeating-linear-gradient(45deg,transparent 0 13px,rgba(255,255,255,0.025) 13px 14px); }
  .cta-in { position:relative; z-index:1; max-width:40ch; }
  .cta h3 { font-family:var(--serif); font-weight:500; font-size:clamp(28px,4.5vw,44px); line-height:1.12;
    letter-spacing:-0.01em; margin:0 0 14px; }
  .cta p { font-size:16.5px; color:#cfcabf; line-height:1.55; margin:0 0 26px; }
  .cta-btns { display:flex; flex-wrap:wrap; gap:12px; }
  .cta-btn { display:inline-flex; align-items:center; gap:9px; text-decoration:none; font-size:15.5px;
    padding:13px 22px; border-radius:3px; }
  .cta-btn.fill { background:var(--accent); color:#191611; }
  .cta-btn.ghost { border:1px solid #4a4842; color:var(--paper); }
  .footer { border-top:1px solid var(--line); background:var(--paper-2); }
  .foot-bottom { padding-block:22px; display:flex; flex-wrap:wrap; gap:10px 20px; align-items:center;
    font-family:var(--mono); font-size:12px; color:var(--muted); }
  .foot-bottom .sig { margin-left:auto; }
  @media (min-width:720px) {
    .meta { grid-template-columns:repeat(4,minmax(0,1fr)); }
    .meta .m-item.span2 { grid-column:span 2; }
    .metrics { grid-template-columns:repeat(4,1fr); }
    .gallery-stage[data-layout="grid"] .g-track { grid-template-columns:repeat(2,1fr); }
  }
  @media (min-width:1080px) {
    .gallery-stage[data-layout="grid"] .g-track { grid-template-columns:repeat(3,1fr); }
  }
  @media (max-width:719px) {
    .nav-links { display:none; }
    .metrics { grid-template-columns:repeat(2,1fr); }
  }
  @media (prefers-reduced-motion:reduce) { * { scroll-behavior:auto !important; transition-duration:0.001ms !important; } }
`

// ── page JS (poll voting + gallery carousel/filmstrip) ───────────────────────
const PAGE_JS = `
(function(){
  document.querySelectorAll('.poll').forEach(function(poll){
    var opts = poll.querySelectorAll('.poll-opt');
    var counts = {}, total = 0;
    opts.forEach(function(o){ var b = parseInt(o.dataset.base||'0',10); counts[o.dataset.key]=b; total+=b; });
    function render(chosen){
      poll.classList.add('voted');
      opts.forEach(function(o){
        var k=o.dataset.key, pct = total ? Math.round(counts[k]/total*100) : 0;
        o.querySelector('.fill').style.width = pct+'%';
        o.querySelector('.pct').textContent = pct+'%';
        o.classList.toggle('chosen', k===chosen);
      });
    }
    opts.forEach(function(o){
      o.addEventListener('click', function(){
        if (poll.classList.contains('voted')) return;
        counts[o.dataset.key] += 1; total += 1; render(o.dataset.key);
      });
    });
  });
  document.querySelectorAll('.gallery-stage').forEach(function(stage){
    var track = stage.querySelector('.g-track');
    var cells = stage.querySelectorAll('.g-cell');
    var dots = stage.querySelector('.g-dots');
    var thumbs = stage.querySelector('.g-thumbs');
    var idx = 0;
    if (!cells.length) return;
    cells.forEach(function(c,i){
      var d=document.createElement('button'); d.className='g-dot'; d.addEventListener('click',function(){go(i);}); dots.appendChild(d);
      var t=document.createElement('button'); t.className='g-thumb'; t.textContent=(i+1<10?'0':'')+(i+1); t.addEventListener('click',function(){go(i);}); thumbs.appendChild(t);
    });
    function go(i){
      idx=(i+cells.length)%cells.length;
      track.style.setProperty('--idx', idx);
      dots.querySelectorAll('.g-dot').forEach(function(d,j){ d.classList.toggle('on', j===idx); });
      thumbs.querySelectorAll('.g-thumb').forEach(function(d,j){ d.classList.toggle('on', j===idx); });
    }
    var prev=stage.querySelector('.prev'), next=stage.querySelector('.next');
    if (prev) prev.addEventListener('click',function(){go(idx-1);});
    if (next) next.addEventListener('click',function(){go(idx+1);});
    go(0);
  });
})();
`
