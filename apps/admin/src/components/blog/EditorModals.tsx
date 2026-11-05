import { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { BlogApiError, resolveEmbed, searchLinkTargets } from '../../api/blogApi'
import type { LinkTarget } from '../../types/blog'
import s from './blogUi.module.css'

// Small dialogs the editor opens through the bridge: link, embed, table size.

function Modal({ title, onClose, children, foot }: {
  title: string
  onClose: () => void
  children: React.ReactNode
  foot: React.ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className={s.modalBackdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.modal} role="dialog" aria-modal="true" aria-label={title}>
        <div className={s.modalHead}>
          <span className={s.modalTitle}>{title}</span>
          <button type="button" className={s.modalClose} onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className={s.modalBody}>{children}</div>
        <div className={s.modalFoot}>{foot}</div>
      </div>
    </div>
  )
}

// ── link ─────────────────────────────────────────────────────────────────────

const SAFE_HREF = /^(https?:\/\/|mailto:|\/(?!\/)|#[\w-]+$)/i

export function LinkModal({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const current = editor.getAttributes('link') as { href?: string; target?: string | null; internal?: LinkTarget | null }
  const { from, to, empty } = editor.state.selection
  const [href, setHref] = useState(current.href ?? '')
  const [text, setText] = useState(empty ? '' : editor.state.doc.textBetween(from, to, ' '))
  const [newTab, setNewTab] = useState(current.target === '_blank')
  const [internal, setInternal] = useState<{ type: string; id: string } | null>(current.internal ?? null)
  const [results, setResults] = useState<LinkTarget[]>([])
  const [error, setError] = useState<string | null>(null)

  const query = href.startsWith('/') || /^https?:/i.test(href) || href.startsWith('#') ? '' : href.trim()
  useEffect(() => {
    if (query.length < 2) return
    const t = setTimeout(() => {
      searchLinkTargets(query).then((r) => setResults(r.items)).catch(() => setResults([]))
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  function apply() {
    let url = href.trim()
    if (url && !SAFE_HREF.test(url) && /^[\w.-]+\.[a-z]{2,}/i.test(url)) url = `https://${url}`
    if (!SAFE_HREF.test(url)) {
      setError('Use a full link (https://…), mailto:, a site path (/blog/…) or #heading.')
      return
    }
    const attrs = { href: url, target: newTab ? '_blank' : null, internal }
    const chain = editor.chain().focus()
    if (empty && !editor.isActive('link')) {
      const label = text.trim() || url
      chain.insertContent({ type: 'text', text: label, marks: [{ type: 'link', attrs }] }).run()
    } else {
      chain.extendMarkRange('link').setLink(attrs as unknown as { href: string }).run()
    }
    onClose()
  }

  return (
    <Modal
      title="Link"
      onClose={onClose}
      foot={(
        <>
          {editor.isActive('link') && (
            <button type="button" className={s.btnGhost} onClick={() => {
              editor.chain().focus().extendMarkRange('link').unsetLink().run()
              onClose()
            }}>
              Remove link
            </button>
          )}
          <button type="button" className={s.btnGhost} onClick={onClose}>Cancel</button>
          <button type="button" className={s.btnPrimary} onClick={apply} disabled={!href.trim()}>Apply</button>
        </>
      )}
    >
      {empty && !editor.isActive('link') && (
        <input className={s.input} value={text} onChange={(e) => setText(e.target.value)} placeholder="Link text" />
      )}
      <input
        className={s.input}
        autoFocus
        value={href}
        onChange={(e) => {
          setHref(e.target.value)
          setInternal(null)
          setError(null)
        }}
        onKeyDown={(e) => e.key === 'Enter' && apply()}
        placeholder="Paste a URL, or type to search your posts & projects"
      />
      {query.length >= 2 && results.length > 0 && (
        <ul className={s.results}>
          {results.map((r) => (
            <li key={`${r.type}-${r.id}`}>
              <button
                type="button"
                onClick={() => {
                  setHref(r.url)
                  setInternal({ type: r.type, id: r.id })
                  setResults([])
                }}
              >
                <span className={s.resultKind}>{r.type}</span> {r.title}
                {r.status !== 'published' && <span className={s.resultDraft}>{r.status}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      <label className={s.check}>
        <input type="checkbox" checked={newTab} onChange={(e) => setNewTab(e.target.checked)} />
        open in a new tab
      </label>
      {internal && <p className={s.note}>Internal link — keeps working if that page’s URL changes.</p>}
      {error && <div className={s.error}>{error}</div>}
    </Modal>
  )
}

// ── embed ────────────────────────────────────────────────────────────────────

export function EmbedModal({ providers, onDone, onClose }: {
  providers: { id: string; label: string }[]
  onDone: (attrs: Record<string, unknown>) => void
  onClose: () => void
}) {
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const r = await resolveEmbed(url.trim())
      onDone({ provider: r.provider, original_url: r.original_url, embed_url: r.embed_url, title: r.title, height: r.height })
      onClose()
    } catch (e) {
      setError(e instanceof BlogApiError ? e.message : 'Could not embed that link.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title="Embed"
      onClose={onClose}
      foot={(
        <>
          <button type="button" className={s.btnGhost} onClick={onClose}>Cancel</button>
          <button type="button" className={s.btnPrimary} disabled={!url.trim() || busy} onClick={() => void submit()}>
            {busy ? 'Checking…' : 'Embed'}
          </button>
        </>
      )}
    >
      <input
        className={s.input}
        autoFocus
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && void submit()}
        placeholder="https://codepen.io/you/pen/…"
      />
      <p className={s.note}>Supported: {providers.map((p) => p.label).join(', ')}. For videos use the Video block.</p>
      {error && <div className={s.error}>{error}</div>}
    </Modal>
  )
}

// ── table size ───────────────────────────────────────────────────────────────

const GRID = 10

export function TableSizeModal({ maxRows, maxCols, onDone, onClose }: {
  maxRows: number
  maxCols: number
  onDone: (rows: number, cols: number) => void
  onClose: () => void
}) {
  const [hover, setHover] = useState<[number, number]>([3, 3])
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)

  const insert = (r: number, c: number) => {
    onDone(Math.max(1, Math.min(maxRows, r)), Math.max(1, Math.min(maxCols, c)))
    onClose()
  }

  return (
    <Modal
      title="Insert table"
      onClose={onClose}
      foot={(
        <>
          <button type="button" className={s.btnGhost} onClick={onClose}>Cancel</button>
          <button type="button" className={s.btnPrimary} onClick={() => insert(rows, cols)}>
            Insert {rows} × {cols}
          </button>
        </>
      )}
    >
      <div className={s.sizeGrid} onMouseLeave={() => setHover([rows, cols])}>
        {Array.from({ length: GRID * GRID }, (_, i) => {
          const r = Math.floor(i / GRID) + 1
          const c = (i % GRID) + 1
          const on = r <= hover[0] && c <= hover[1]
          return (
            <button
              key={i}
              type="button"
              aria-label={`${r} by ${c}`}
              className={`${s.sizeCell}${on ? ` ${s.sizeCellOn}` : ''}`}
              onMouseEnter={() => setHover([r, c])}
              onClick={() => insert(r, c)}
            />
          )
        })}
      </div>
      <div className={s.sizeInputs}>
        <label>rows <input type="number" min={1} max={maxRows} value={rows} onChange={(e) => setRows(Number(e.target.value) || 1)} /></label>
        <label>columns <input type="number" min={1} max={maxCols} value={cols} onChange={(e) => setCols(Number(e.target.value) || 1)} /></label>
        <span className={s.note}>The first row is a header. Add or remove rows and columns any time from the table bar.</span>
      </div>
    </Modal>
  )
}
