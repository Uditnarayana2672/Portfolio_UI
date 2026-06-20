import UploadZone from '../../UploadZone'
import SegControl from '../../SegControl'
import styles from './editors.module.css'

interface ImageData {
  imageUrl: string
  caption: string
  size: string
  align: string
}

const SIZE_OPTS = [
  { value: 'full',  label: 'Full width' },
  { value: 'half',  label: 'Half width' },
  { value: 'third', label: 'Third width' },
]

const ALIGN_OPTS = [
  { value: 'left',   label: '← Left' },
  { value: 'center', label: '↔ Center' },
  { value: 'right',  label: 'Right →' },
]

interface Props {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export default function ImageEditor({ data, onChange }: Props) {
  const d = data as unknown as ImageData
  function set(patch: Partial<ImageData>) {
    onChange({ ...d, ...patch })
  }

  return (
    <div>
      <div className={styles.edRow}>
        <UploadZone
          label="Image"
          hint="drop or click to browse · jpg · png · webp · svg"
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
            Caption <span className={styles.hint}>shown below the image</span>
          </label>
          <input
            className={styles.fi}
            type="text"
            value={d.caption}
            placeholder="optional caption"
            onChange={(e) => set({ caption: e.target.value })}
          />
        </div>
      </div>

      <div className={`${styles.edRow} ${styles.cols2}`}>
        <div className={styles.fg}>
          <label className={styles.fl}>Size</label>
          <SegControl
            options={SIZE_OPTS}
            value={d.size}
            onChange={(v) => set({ size: v })}
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
    </div>
  )
}
