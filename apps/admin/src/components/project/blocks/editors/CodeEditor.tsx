import { useRef, useState } from 'react'
import styles from './editors.module.css'

interface CodeData {
  code: string
  language: string
  filename: string
}

const CODE_LANGS = [
  'javascript', 'typescript', 'python', 'jsx', 'tsx', 'html', 'css',
  'json', 'bash', 'go', 'rust', 'sql', 'yaml', 'markdown',
]

interface Props {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

function lineNumbers(code: string): string {
  const n = Math.max(1, code.split('\n').length)
  return Array.from({ length: n }, (_, i) => i + 1).join('\n')
}

export default function CodeEditor({ data, onChange }: Props) {
  const d = data as unknown as CodeData
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const linesRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  function set(patch: Partial<CodeData>) {
    onChange({ ...d, ...patch })
  }

  function syncScroll() {
    if (linesRef.current && areaRef.current) {
      linesRef.current.scrollTop = areaRef.current.scrollTop
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Tab') return
    e.preventDefault()
    const el = e.currentTarget
    const start = el.selectionStart
    const end = el.selectionEnd
    const next = el.value.slice(0, start) + '  ' + el.value.slice(end)
    set({ code: next })
    // Restore cursor after controlled re-render
    requestAnimationFrame(() => {
      if (areaRef.current) {
        areaRef.current.selectionStart = areaRef.current.selectionEnd = start + 2
      }
    })
  }

  async function handleCopy() {
    const text = areaRef.current?.value ?? d.code
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      if (areaRef.current) {
        areaRef.current.focus()
        areaRef.current.select()
        document.execCommand('copy')
        areaRef.current.setSelectionRange(0, 0)
      }
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div>
      <div className={`${styles.edRow} ${styles.cols2}`}>
        <div className={styles.fg}>
          <label className={styles.fl}>Language</label>
          <select
            className={`${styles.fi} ${styles.fiSelect}`}
            value={d.language}
            onChange={(e) => set({ language: e.target.value })}
          >
            {CODE_LANGS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div className={styles.fg}>
          <label className={styles.fl}>
            Filename <span className={styles.hint}>optional · shown as tab label</span>
          </label>
          <input
            className={styles.fi}
            type="text"
            value={d.filename}
            placeholder="e.g. app.tsx"
            onChange={(e) => set({ filename: e.target.value })}
          />
        </div>
      </div>

      <div className={styles.edRow}>
        <div className={styles.fg}>
          <label className={styles.fl}>Code</label>
          <div className={styles.edCodeWrap}>
            <div ref={linesRef} className={styles.edCodeLines}>
              {lineNumbers(d.code)}
            </div>
            <textarea
              ref={areaRef}
              className={styles.edCodeArea}
              spellCheck={false}
              placeholder="// paste or type your code…"
              value={d.code}
              onChange={(e) => set({ code: e.target.value })}
              onScroll={syncScroll}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              className={`${styles.edCodeCopy} ${copied ? styles.edCodeCopied : ''}`}
              onClick={handleCopy}
            >
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
