import UploadZone from '../../UploadZone'
import SegControl from '../../SegControl'
import styles from './editors.module.css'

interface GalleryImage { url: string; alt: string }
interface GalleryData { images: GalleryImage[]; layout: string }

const LAYOUT_OPTS = [
  { value: 'grid',      label: '⊞ Grid' },
  { value: 'carousel',  label: '◁▷ Carousel' },
  { value: 'filmstrip', label: '▤ Filmstrip' },
]

interface Props {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

export default function GalleryEditor({ data, onChange }: Props) {
  const d = data as unknown as GalleryData
  const images: GalleryImage[] = Array.isArray(d.images) ? d.images : []

  function set(patch: Partial<GalleryData>) {
    onChange({ ...d, ...patch })
  }

  function addImage(url: string) {
    set({ images: [...images, { url, alt: '' }] })
  }

  function removeImage(i: number) {
    set({ images: images.filter((_, idx) => idx !== i) })
  }

  return (
    <div>
      <div className={styles.edRow}>
        <div className={styles.fg}>
          <label className={styles.fl}>
            Images <span className={styles.hint}>click × to remove · any order</span>
          </label>
          <UploadZone
            hint="jpg · png · webp · svg · click to add"
            folder="projects/gallery"
            onComplete={addImage}
          />
          {images.length > 0 && (
            <div className={styles.galleryThumbGrid}>
              {images.map((img, i) => (
                <div key={i} className={styles.galleryThumb}>
                  <img src={img.url} alt={img.alt} />
                  <button
                    type="button"
                    className={styles.galleryThumbRm}
                    onClick={() => removeImage(i)}
                    title="Remove"
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.edRow}>
        <div className={styles.fg}>
          <label className={styles.fl}>Layout</label>
          <SegControl
            options={LAYOUT_OPTS}
            value={d.layout}
            onChange={(v) => set({ layout: v })}
          />
        </div>
      </div>
    </div>
  )
}
