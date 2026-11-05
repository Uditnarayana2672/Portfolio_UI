import styles from './editors.module.css'

interface CmpData {
  leftLabel: string
  leftContent: string
  rightLabel: string
  rightContent: string
}

interface Props {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export default function ComparisonEditor({ data, onChange }: Props) {
  const d = data as unknown as CmpData
  function set(patch: Partial<CmpData>) {
    onChange({ ...d, ...patch })
  }

  return (
    <div>
      <div className={styles.edRow}>
        <label className={styles.fl}>
          Side-by-side comparison — fill both columns
        </label>
      </div>

      <div className={styles.vsLayout}>
        <div className={styles.vsCol}>
          <div className={styles.fg}>
            <label className={styles.fl}>Left label</label>
            <input
              className={styles.fi}
              type="text"
              value={d.leftLabel}
              placeholder="Before"
              onChange={(e) => set({ leftLabel: e.target.value })}
            />
          </div>
          <div className={styles.fg}>
            <label className={styles.fl}>Left content</label>
            <textarea
              className={styles.fi}
              value={d.leftContent}
              onChange={(e) => set({ leftContent: e.target.value })}
            />
          </div>
        </div>

        <div className={styles.vsDivider}><span>VS</span></div>

        <div className={styles.vsCol}>
          <div className={styles.fg}>
            <label className={styles.fl}>Right label</label>
            <input
              className={styles.fi}
              type="text"
              value={d.rightLabel}
              placeholder="After"
              onChange={(e) => set({ rightLabel: e.target.value })}
            />
          </div>
          <div className={styles.fg}>
            <label className={styles.fl}>Right content</label>
            <textarea
              className={styles.fi}
              value={d.rightContent}
              onChange={(e) => set({ rightContent: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
