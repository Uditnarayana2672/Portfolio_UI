import { useRef, useEffect } from 'react'
import SegControl from '../../SegControl'
import styles from './editors.module.css'

interface TextData { html: string; style?: string }

interface Props {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

const STYLE_OPTS = [
  { value: 'standard', label: 'Standard' },
  { value: 'dropcap',  label: 'Drop-cap' },
  { value: 'lead',     label: 'Lead' },
  { value: 'twocol',   label: 'Two-column' },
]

export default function TextEditor({ data, onChange }: Props) {
  const d = data as unknown as TextData
  const editorRef = useRef<HTMLDivElement>(null)
  const wcRef = useRef<HTMLDivElement>(null)

  // Seed innerHTML once on mount — intentional empty dep array to avoid cursor reset
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = d.html || ''
      refreshWc()
    }
  }, [])

  function refreshWc() {
    if (!editorRef.current || !wcRef.current) return
    const text = editorRef.current.textContent?.trim() ?? ''
    const words = text ? text.split(/\s+/).length : 0
    wcRef.current.textContent = `${words} WORD${words !== 1 ? 'S' : ''}`
  }

  function handleInput() {
    if (!editorRef.current) return
    onChange({ ...d, html: editorRef.current.innerHTML })
    refreshWc()
  }

  function execCmd(cmd: string, arg?: string) {
    editorRef.current?.focus()
    if (cmd === 'createLink') {
      const url = prompt('Link URL:', 'https://')
      if (url) document.execCommand('createLink', false, url)
    } else if (cmd === 'formatBlock') {
      document.execCommand('formatBlock', false, arg)
    } else {
      document.execCommand(cmd, false, undefined)
    }
    // Sync html after execCommand modifies DOM
    requestAnimationFrame(handleInput)
  }

  return (
    <div>
      <div className={styles.edRow}>
        <div className={styles.fg}>
          <label className={styles.fl}>
            Text content{' '}
            <span className={styles.hint}>bold, italic, headings &amp; links</span>
          </label>
          <div className={styles.edToolbar}>
            <button type="button" className={styles.edTb} title="Bold"
              onClick={() => execCmd('bold')}><b>B</b></button>
            <button type="button" className={styles.edTb} title="Italic"
              onClick={() => execCmd('italic')}><i>I</i></button>
            <button type="button" className={styles.edTb} title="Underline"
              onClick={() => execCmd('underline')}><u>U</u></button>
            <button type="button" className={`${styles.edTb} ${styles.edTbWide}`} title="Heading 2"
              onClick={() => execCmd('formatBlock', 'H2')}>H2</button>
            <button type="button" className={`${styles.edTb} ${styles.edTbWide}`} title="Heading 3"
              onClick={() => execCmd('formatBlock', 'H3')}>H3</button>
            <button type="button" className={styles.edTb} title="Insert link"
              onClick={() => execCmd('createLink')}>↗</button>
          </div>
          <div
            ref={editorRef}
            className={styles.edContenteditable}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
          />
          <div ref={wcRef} className={styles.edWordcount}>0 WORDS</div>
        </div>
      </div>

      <div className={styles.edRow}>
        <div className={styles.fg}>
          <label className={styles.fl}>
            Writing style <span className={styles.hint}>how this reads on the public page</span>
          </label>
          <SegControl
            options={STYLE_OPTS}
            value={d.style || 'standard'}
            onChange={(v) => onChange({ ...d, style: v })}
          />
        </div>
      </div>
    </div>
  )
}
