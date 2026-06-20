import SegControl from '../../SegControl'
import styles from './editors.module.css'

interface QuoteData {
  text: string
  name: string
  role: string
  style: string
}

const STYLE_OPTS = [
  { value: 'blockquote', label: 'Blockquote — left border' },
  { value: 'pullquote',  label: 'Pull quote — centred' },
]

interface Props {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export default function QuoteEditor({ data, onChange }: Props) {
  const d = data as unknown as QuoteData
  function set(patch: Partial<QuoteData>) {
    onChange({ ...d, ...patch })
  }

  const attrLine = [d.name, d.role].filter(Boolean).join(' · ')
  const isPull = d.style === 'pullquote'

  return (
    <div>
      <div className={`${styles.edRow} ${styles.cols2}`}>
        <div className={`${styles.fg} ${styles.spanFull}`}>
          <label className={styles.fl}>Quote text</label>
          <textarea
            className={`${styles.fi} ${styles.quoteTextarea}`}
            value={d.text}
            onChange={(e) => set({ text: e.target.value })}
          />
        </div>

        <div className={styles.fg}>
          <label className={styles.fl}>Attribution — name</label>
          <input
            className={styles.fi}
            type="text"
            value={d.name}
            placeholder="e.g. Ada Lovelace"
            onChange={(e) => set({ name: e.target.value })}
          />
        </div>

        <div className={styles.fg}>
          <label className={styles.fl}>
            Attribution — role <span className={styles.hint}>optional</span>
          </label>
          <input
            className={styles.fi}
            type="text"
            value={d.role}
            placeholder="e.g. Mathematician, 1843"
            onChange={(e) => set({ role: e.target.value })}
          />
        </div>
      </div>

      <div className={styles.edRow}>
        <div className={styles.fg}>
          <label className={styles.fl}>Style</label>
          <SegControl
            options={STYLE_OPTS}
            value={d.style}
            onChange={(v) => set({ style: v })}
          />
        </div>
      </div>

      <div className={styles.quotePreview}>
        <div className={styles.quotePreviewHead}>Live preview</div>
        <div className={isPull ? styles.qpPullquote : styles.qpBlockquote}>
          <div className={styles.qpText}>
            {d.text || <em style={{ opacity: 0.4 }}>Your quote will appear here…</em>}
          </div>
          {attrLine && <div className={styles.qpAttr}>{attrLine}</div>}
        </div>
      </div>
    </div>
  )
}
