import SegControl from '../../SegControl'
import styles from './editors.module.css'

interface CtaData {
  label: string
  url: string
  style: string
  align: string
  subtext: string
}

const STYLE_OPTS = [
  { value: 'primary', label: 'Primary' },
  { value: 'ghost',   label: 'Ghost' },
  { value: 'accent',  label: 'Accent' },
]

const ALIGN_OPTS = [
  { value: 'left',   label: '← Left' },
  { value: 'center', label: '↔ Centre' },
  { value: 'right',  label: 'Right →' },
]

const CPB_CLS: Record<string, string> = {
  primary: styles.cpbPrimary,
  ghost:   styles.cpbGhost,
  accent:  styles.cpbAccent,
}

const STAGE_CLS: Record<string, string> = {
  left:   styles.alignLeft,
  center: styles.alignCenter,
  right:  styles.alignRight,
}

interface Props {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export default function CtaEditor({ data, onChange }: Props) {
  const d = data as unknown as CtaData
  function set(patch: Partial<CtaData>) {
    onChange({ ...d, ...patch })
  }

  return (
    <div>
      <div className={`${styles.edRow} ${styles.cols2}`}>
        <div className={styles.fg}>
          <label className={styles.fl}>Button label</label>
          <input
            className={styles.fi}
            type="text"
            value={d.label}
            placeholder="e.g. View on GitHub"
            onChange={(e) => set({ label: e.target.value })}
          />
        </div>
        <div className={styles.fg}>
          <label className={styles.fl}>URL</label>
          <input
            className={styles.fi}
            type="text"
            value={d.url}
            placeholder="https://…"
            onChange={(e) => set({ url: e.target.value })}
          />
        </div>
      </div>

      <div className={`${styles.edRow} ${styles.cols2}`}>
        <div className={styles.fg}>
          <label className={styles.fl}>Style</label>
          <SegControl
            options={STYLE_OPTS}
            value={d.style}
            onChange={(v) => set({ style: v })}
          />
        </div>
        <div className={styles.fg}>
          <label className={styles.fl}>Alignment</label>
          <SegControl
            options={ALIGN_OPTS}
            value={d.align}
            onChange={(v) => set({ align: v })}
          />
        </div>
      </div>

      <div className={styles.edRow}>
        <div className={styles.fg}>
          <label className={styles.fl}>
            Sub-text <span className={styles.hint}>optional · shown below button</span>
          </label>
          <input
            className={styles.fi}
            type="text"
            value={d.subtext}
            placeholder="e.g. No account needed · opens in new tab"
            onChange={(e) => set({ subtext: e.target.value })}
          />
        </div>
      </div>

      {/* Live preview — updates on every keystroke */}
      <div className={styles.ctaPreviewWrap}>
        <div className={styles.ctaPreviewHead}>Live preview</div>
        <div className={`${styles.ctaPreviewStage} ${STAGE_CLS[d.align] ?? styles.alignCenter}`}>
          <span className={`${styles.cpb} ${CPB_CLS[d.style] ?? styles.cpbPrimary}`}>
            {d.label || 'Button label'}
          </span>
          {d.subtext && (
            <span className={styles.ctaPreviewSub}>{d.subtext}</span>
          )}
        </div>
      </div>
    </div>
  )
}
