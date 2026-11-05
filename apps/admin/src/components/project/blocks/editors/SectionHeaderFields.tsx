import styles from './editors.module.css'

// Optional editorial header (eyebrow + heading + subheading) shown above a
// content block on the public project page. Rendered by the drawer for every
// "section" block type, so a single component covers all of them.
interface Props {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export default function SectionHeaderFields({ data, onChange }: Props) {
  const eyebrow = (data.eyebrow as string) ?? ''
  const heading = (data.heading as string) ?? ''
  const subheading = (data.subheading as string) ?? ''
  const set = (patch: Record<string, unknown>) => onChange({ ...data, ...patch })

  return (
    <details className={styles.sectionHeader} open={!!(eyebrow || heading || subheading)}>
      <summary className={styles.sectionHeaderSummary}>
        Section header <span className={styles.hint}>eyebrow · heading · shown above this block</span>
      </summary>

      <div className={`${styles.edRow} ${styles.cols2}`} style={{ marginTop: 12 }}>
        <div className={styles.fg}>
          <label className={styles.fl}>
            Eyebrow <span className={styles.hint}>auto-numbered kicker</span>
          </label>
          <input
            className={styles.fi}
            type="text"
            value={eyebrow}
            placeholder="e.g. Overview"
            onChange={(e) => set({ eyebrow: e.target.value })}
          />
        </div>
        <div className={styles.fg}>
          <label className={styles.fl}>Heading</label>
          <input
            className={styles.fi}
            type="text"
            value={heading}
            placeholder="e.g. Numbers after ten weeks live"
            onChange={(e) => set({ heading: e.target.value })}
          />
        </div>
      </div>

      <div className={styles.edRow}>
        <div className={styles.fg}>
          <label className={styles.fl}>
            Subheading <span className={styles.hint}>optional one-liner under the heading</span>
          </label>
          <input
            className={styles.fi}
            type="text"
            value={subheading}
            placeholder="optional…"
            onChange={(e) => set({ subheading: e.target.value })}
          />
        </div>
      </div>
    </details>
  )
}
