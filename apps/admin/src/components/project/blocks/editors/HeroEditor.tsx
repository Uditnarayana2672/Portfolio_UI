import UploadZone from '../../UploadZone'
import Toggle from '../../Toggle'
import SegControl from '../../SegControl'
import styles from './editors.module.css'

interface HeroData {
  imageUrl: string
  altText: string
  height: string
  showCaption: boolean
  caption: string
}

const HEIGHT_OPTS = [
  { value: 'compact',  label: 'Compact · 40vh' },
  { value: 'standard', label: 'Standard · 60vh' },
  { value: 'full',     label: 'Full viewport · 100vh' },
]

interface Props {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export default function HeroEditor({ data, onChange }: Props) {
  const d = data as unknown as HeroData
  function set(patch: Partial<HeroData>) {
    onChange({ ...d, ...patch })
  }

  return (
    <div>
      <div className={styles.edRow}>
        <UploadZone
          label="Hero image"
          hint="drop or click to browse · jpg · png · webp · max 5 MB"
          folder="projects/gallery"
          onComplete={(url) => set({ imageUrl: url })}
          value={d.imageUrl || undefined}
        />
      </div>

      <div className={`${styles.edRow} ${styles.cols2}`}>
        <div className={styles.fg}>
          <label className={styles.fl}>Image URL</label>
          <input
            className={styles.fi}
            type="text"
            value={d.imageUrl}
            placeholder="https://… or /uploads/…"
            onChange={(e) => set({ imageUrl: e.target.value })}
          />
        </div>
        <div className={styles.fg}>
          <label className={styles.fl}>
            Alt text <span className={styles.hint}>for screen readers</span>
          </label>
          <input
            className={styles.fi}
            type="text"
            value={d.altText}
            placeholder="Describe the image"
            onChange={(e) => set({ altText: e.target.value })}
          />
        </div>
      </div>

      <div className={styles.edRow}>
        <div className={styles.fg}>
          <label className={styles.fl}>Height</label>
          <SegControl
            options={HEIGHT_OPTS}
            value={d.height}
            onChange={(v) => set({ height: v })}
          />
        </div>
      </div>

      <div className={styles.edRow}>
        <Toggle
          label="Show caption"
          subLabel="Adds a caption overlay at the bottom of the hero."
          checked={d.showCaption}
          onChange={(v) => set({ showCaption: v })}
        />
        {d.showCaption && (
          <div className={`${styles.fg} ${styles.captionField}`}>
            <label className={styles.fl}>Caption text</label>
            <input
              className={styles.fi}
              type="text"
              value={d.caption}
              placeholder="A short overlay caption"
              onChange={(e) => set({ caption: e.target.value })}
            />
          </div>
        )}
      </div>
    </div>
  )
}
