import { useState } from 'react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import type { ReactNodeViewProps } from '@tiptap/react'
import { useBlogEditorStore } from '../../../store/blogEditorStore'
import { editorBridge, imageAttrs } from './editorBridge'
import s from './editor.module.css'

// React views for the custom blocks while editing. What readers see is the
// server-rendered HTML; these only need to be clear and editable.

type Attrs = Record<string, unknown>

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function cldThumb(url: string, transform: string) {
  return url.includes('res.cloudinary.com') && url.includes('/upload/')
    ? url.replace('/upload/', `/upload/${transform}/`)
    : url
}

function BlockChrome({ label, onDelete, children, selected }: {
  label: string
  onDelete: () => void
  children?: React.ReactNode
  selected?: boolean
}) {
  return (
    <div className={`${s.chrome}${selected ? ` ${s.chromeSelected}` : ''}`} contentEditable={false}>
      <span className={s.chromeTag} data-drag-handle>⠿ {label}</span>
      <div className={s.chromeTools}>{children}</div>
      <button type="button" className={s.chromeDelete} onClick={onDelete} title="Remove block">×</button>
    </div>
  )
}

// ── callout ──────────────────────────────────────────────────────────────────

export function CalloutView({ node, updateAttributes, deleteNode }: ReactNodeViewProps) {
  const variants = useBlogEditorStore((st) => st.config?.callout_variants) ?? []
  const attrs = node.attrs as Attrs
  const variant = str(attrs.variant) || 'note'
  const icon = str(attrs.icon) || variants.find((v) => v.id === variant)?.icon || '✏︎'
  return (
    <NodeViewWrapper className={`${s.callout} ${s[`callout_${variant}`] ?? ''}`} data-callout={variant}>
      <div className={s.calloutHead} contentEditable={false}>
        <input
          className={s.calloutIcon}
          value={icon}
          maxLength={4}
          aria-label="Callout icon"
          onChange={(e) => updateAttributes({ icon: e.target.value || null })}
        />
        <input
          className={s.calloutTitle}
          value={str(attrs.title)}
          placeholder="Bold title (optional)"
          maxLength={120}
          onChange={(e) => updateAttributes({ title: e.target.value || null })}
        />
        <select
          className={s.miniSelect}
          value={variant}
          onChange={(e) => updateAttributes({ variant: e.target.value, icon: null })}
          aria-label="Callout style"
        >
          {variants.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
        <button type="button" className={s.chromeDelete} onClick={deleteNode} title="Remove callout">×</button>
      </div>
      <NodeViewContent className={s.calloutBody} />
    </NodeViewWrapper>
  )
}

// ── quote ────────────────────────────────────────────────────────────────────

export function QuoteView({ node, updateAttributes }: ReactNodeViewProps) {
  const attrs = node.attrs as Attrs
  return (
    <NodeViewWrapper as="figure" className={`${s.quote}${attrs.variant === 'pull' ? ` ${s.quotePull}` : ''}`}>
      <NodeViewContent<'blockquote'> as="blockquote" className={s.quoteBody} />
      <div className={s.quoteFoot} contentEditable={false}>
        <span>—</span>
        <input
          className={s.quoteAttribution}
          value={str(attrs.attribution)}
          placeholder="Who said it? (e.g. alpha tester, week 2)"
          maxLength={120}
          onChange={(e) => updateAttributes({ attribution: e.target.value || null })}
        />
        <label className={s.quoteToggle}>
          <input
            type="checkbox"
            checked={attrs.variant === 'pull'}
            onChange={(e) => updateAttributes({ variant: e.target.checked ? 'pull' : 'default' })}
          />
          pull quote
        </label>
      </div>
    </NodeViewWrapper>
  )
}

// ── code block ───────────────────────────────────────────────────────────────

export function CodeBlockView({ node, updateAttributes }: ReactNodeViewProps) {
  const languages = useBlogEditorStore((st) => st.config?.code_languages) ?? []
  const attrs = node.attrs as Attrs
  return (
    <NodeViewWrapper className={s.code}>
      <div className={s.codeBar} contentEditable={false}>
        <input
          className={s.codeFile}
          value={str(attrs.filename)}
          placeholder="filename (optional)"
          maxLength={80}
          onChange={(e) => updateAttributes({ filename: e.target.value || null })}
        />
        <select
          className={s.codeLang}
          value={str(attrs.language) || 'plaintext'}
          onChange={(e) => updateAttributes({ language: e.target.value })}
          aria-label="Code language"
        >
          {languages.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
      </div>
      <pre spellCheck={false}>
        <NodeViewContent<'code'> as="code" className={`language-${str(attrs.language) || 'plaintext'}`} />
      </pre>
    </NodeViewWrapper>
  )
}

// ── image ────────────────────────────────────────────────────────────────────

export function ImageView({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps) {
  const attrs = node.attrs as Attrs
  const alt = str(attrs.alt)
  return (
    <NodeViewWrapper className={s.media}>
      <BlockChrome label="Image" onDelete={deleteNode} selected={selected}>
        <select
          className={s.miniSelect}
          value={str(attrs.size) || 'normal'}
          onChange={(e) => updateAttributes({ size: e.target.value })}
          aria-label="Image width"
        >
          <option value="normal">Normal width</option>
          <option value="wide">Wide</option>
          <option value="full">Full bleed</option>
        </select>
        <button
          type="button"
          className={s.miniBtn}
          onClick={() => editorBridge.openMedia({
            kind: 'image',
            onPick: ([a]) => a && updateAttributes({ ...imageAttrs(a), caption: attrs.caption, size: attrs.size }),
          })}
        >
          Replace
        </button>
      </BlockChrome>
      {attrs.src ? (
        <img className={s.mediaImg} src={cldThumb(str(attrs.src), 'f_auto,q_auto,w_1200')} alt={alt} />
      ) : (
        <div className={s.mediaMissing}>Image missing</div>
      )}
      <div className={s.mediaFields} contentEditable={false}>
        <input
          className={`${s.fieldInput}${alt.trim().length < 3 ? ` ${s.fieldInvalid}` : ''}`}
          value={alt}
          placeholder="Alt text — describe the image (required to publish)"
          maxLength={250}
          onChange={(e) => updateAttributes({ alt: e.target.value || null })}
        />
        <input
          className={s.fieldInput}
          value={str(attrs.caption)}
          placeholder="Caption (optional)"
          maxLength={300}
          onChange={(e) => updateAttributes({ caption: e.target.value || null })}
        />
      </div>
    </NodeViewWrapper>
  )
}

// ── gallery ──────────────────────────────────────────────────────────────────

type GalleryItem = ReturnType<typeof imageAttrs>

export function GalleryView({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps) {
  const attrs = node.attrs as Attrs
  const items = (attrs.items as GalleryItem[]) ?? []
  const [active, setActive] = useState(0)
  const setItems = (next: GalleryItem[]) => updateAttributes({ items: next })
  const move = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    setItems(next)
    setActive(j)
  }
  const current = items[active]
  return (
    <NodeViewWrapper className={s.media}>
      <BlockChrome label={`Gallery · ${items.length} images`} onDelete={deleteNode} selected={selected}>
        <select
          className={s.miniSelect}
          value={str(attrs.height) || 'md'}
          onChange={(e) => updateAttributes({ height: e.target.value })}
          aria-label="Gallery height"
        >
          <option value="sm">Short</option>
          <option value="md">Medium</option>
          <option value="lg">Tall</option>
        </select>
        <button
          type="button"
          className={s.miniBtn}
          onClick={() => editorBridge.openMedia({
            kind: 'gallery',
            onPick: (assets) => setItems([...items, ...assets.map(imageAttrs)].slice(0, 20)),
          })}
        >
          + Add images
        </button>
      </BlockChrome>
      <div className={s.galleryStrip} contentEditable={false}>
        {items.map((item, i) => (
          <figure
            key={`${item.asset_id}-${i}`}
            className={`${s.galleryItem}${i === active ? ` ${s.galleryActive}` : ''}${!item.alt ? ` ${s.galleryNoAlt}` : ''}`}
            onClick={() => setActive(i)}
          >
            <img src={cldThumb(str(item.src), 'f_auto,q_auto,h_360,c_limit')} alt={str(item.alt)} />
          </figure>
        ))}
      </div>
      {current && (
        <div className={s.mediaFields} contentEditable={false}>
          <div className={s.galleryItemTools}>
            <span>Image {active + 1} of {items.length}</span>
            <button type="button" className={s.miniBtn} onClick={() => move(active, -1)} disabled={active === 0}>← Move</button>
            <button type="button" className={s.miniBtn} onClick={() => move(active, 1)} disabled={active === items.length - 1}>Move →</button>
            <button
              type="button"
              className={s.miniBtn}
              onClick={() => {
                const next = items.filter((_, i) => i !== active)
                setActive(Math.max(0, active - 1))
                setItems(next)
              }}
            >
              Remove
            </button>
          </div>
          <input
            className={`${s.fieldInput}${str(current.alt).trim().length < 3 ? ` ${s.fieldInvalid}` : ''}`}
            value={str(current.alt)}
            placeholder="Alt text for this image (required to publish)"
            maxLength={250}
            onChange={(e) => setItems(items.map((it, i) => (i === active ? { ...it, alt: e.target.value || null } : it)))}
          />
          <input
            className={s.fieldInput}
            value={str(attrs.caption)}
            placeholder="Gallery caption (optional)"
            maxLength={300}
            onChange={(e) => updateAttributes({ caption: e.target.value || null })}
          />
        </div>
      )}
      {items.length < 2 && (
        <div className={s.mediaHint} contentEditable={false}>A gallery needs at least 2 images.</div>
      )}
    </NodeViewWrapper>
  )
}

// ── video ────────────────────────────────────────────────────────────────────

export function VideoView({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps) {
  const attrs = node.attrs as Attrs
  const youtube = attrs.source === 'youtube'
  const poster = str(attrs.poster_url) || (youtube ? `https://i.ytimg.com/vi/${str(attrs.external_id)}/hqdefault.jpg` : '')
  return (
    <NodeViewWrapper className={s.media}>
      <BlockChrome label={youtube ? 'YouTube video' : 'Video'} onDelete={deleteNode} selected={selected} />
      <div className={s.video} contentEditable={false}>
        {youtube ? (
          <>
            {poster && <img src={poster} alt="" />}
            <span className={s.videoPlay}>▶</span>
            <span className={s.videoLabel}>YOUTUBE · {str(attrs.title) || str(attrs.external_id)}</span>
          </>
        ) : (
          <video src={str(attrs.src)} poster={poster || undefined} controls preload="metadata" />
        )}
      </div>
      <div className={s.mediaFields} contentEditable={false}>
        <input
          className={s.fieldInput}
          value={str(attrs.caption)}
          placeholder="Caption (optional)"
          maxLength={300}
          onChange={(e) => updateAttributes({ caption: e.target.value || null })}
        />
        {youtube && (
          <div className={s.mediaHint}>Plays on the page; readers also get a “Watch on YouTube ↗” link.</div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

// ── embed ────────────────────────────────────────────────────────────────────

export function EmbedView({ node, updateAttributes, deleteNode, selected }: ReactNodeViewProps) {
  const attrs = node.attrs as Attrs
  const height = Number(attrs.height) || 420
  return (
    <NodeViewWrapper className={s.media}>
      <BlockChrome label={`Embed · ${str(attrs.provider)}`} onDelete={deleteNode} selected={selected}>
        <label className={s.miniLabel}>
          height
          <input
            type="number"
            min={200}
            max={900}
            step={20}
            className={s.miniNumber}
            value={height}
            onChange={(e) => updateAttributes({ height: Math.max(200, Math.min(900, Number(e.target.value) || 420)) })}
          />
        </label>
      </BlockChrome>
      <iframe
        className={s.embedFrame}
        src={str(attrs.embed_url)}
        height={height}
        title={str(attrs.title) || str(attrs.provider)}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        loading="lazy"
      />
    </NodeViewWrapper>
  )
}
