import Toggle from '../../Toggle'
import styles from './editors.module.css'

interface EmbedData {
  embedUrl: string
  provider: string
  sourceLabel: string
  caption: string
  height: number
  allowFullscreen: boolean
}

interface Props {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export default function EmbedEditor({ data, onChange }: Props) {
  const d = data as unknown as EmbedData
  function set(patch: Partial<EmbedData>) {
    onChange({ ...d, ...patch })
  }

  return (
    <div>
      <div className={styles.edRow}>
        <div className={styles.fg}>
          <label className={styles.fl}>
            Embed URL <span className={styles.hint}>CodeSandbox, CodePen, Figma, a live demo…</span>
          </label>
          <input
            className={styles.fi}
            type="text"
            value={d.embedUrl}
            placeholder="https://codesandbox.io/embed/…"
            onChange={(e) => set({ embedUrl: e.target.value })}
          />
        </div>
      </div>

      <div className={`${styles.edRow} ${styles.cols2}`}>
        <div className={styles.fg}>
          <label className={styles.fl}>
            Provider chip <span className={styles.hint}>shown top-right</span>
          </label>
          <input
            className={styles.fi}
            type="text"
            value={d.provider}
            placeholder="CodeSandbox"
            onChange={(e) => set({ provider: e.target.value })}
          />
        </div>
        <div className={styles.fg}>
          <label className={styles.fl}>
            Source label <span className={styles.hint}>shown in the bar</span>
          </label>
          <input
            className={styles.fi}
            type="text"
            value={d.sourceLabel}
            placeholder="codesandbox.io/s/my-demo"
            onChange={(e) => set({ sourceLabel: e.target.value })}
          />
        </div>
      </div>

      <div className={`${styles.edRow} ${styles.cols2}`}>
        <div className={styles.fg}>
          <label className={styles.fl}>Caption</label>
          <input
            className={styles.fi}
            type="text"
            value={d.caption}
            placeholder="optional caption…"
            onChange={(e) => set({ caption: e.target.value })}
          />
        </div>
        <div className={styles.fg}>
          <label className={styles.fl}>
            Height <span className={styles.hint}>pixels</span>
          </label>
          <input
            className={styles.fi}
            type="number"
            min={120}
            max={4000}
            value={d.height ?? 480}
            onChange={(e) => set({ height: Number(e.target.value) || 480 })}
          />
        </div>
      </div>

      <div className={styles.edRow}>
        <Toggle
          label="Allow fullscreen"
          subLabel="Lets visitors expand the embed."
          checked={d.allowFullscreen !== false}
          onChange={(v) => set({ allowFullscreen: v })}
        />
      </div>
    </div>
  )
}
