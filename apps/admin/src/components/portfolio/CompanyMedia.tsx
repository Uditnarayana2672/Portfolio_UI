import { useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import { companyImage, companyLogo } from '@udit/shared/images'
import MediaPickerModal from '../blog/MediaPickerModal'
import type { MediaRequest, PickedAsset } from '../blog/editor/editorBridge'
import type { CompanyImage, ImageCrop, Portrait } from '../../types/portfolio'
import { FieldError, RowActions, TextField } from './fields'
import { moved, removed, replaced } from './portfolioHelpers'
import styles from './PortfolioInfo.module.css'

const MAX_IMAGES = 6
const ASPECT = 5 / 4
const ROUND = 10000

/** The crop tool reports percentages; the API stores fractions from 0 to 1. */
function toCrop(area: { x: number; y: number; width: number; height: number }): ImageCrop {
  const round = (percent: number) => Math.round((percent / 100) * ROUND) / ROUND
  const x = Math.max(round(area.x), 0)
  const y = Math.max(round(area.y), 0)
  return {
    x,
    y,
    width: Math.min(round(area.width), 1 - x),
    height: Math.min(round(area.height), 1 - y),
  }
}

function usePicker() {
  const [request, setRequest] = useState<MediaRequest | null>(null)
  const open = (onPick: (asset: PickedAsset) => void) => setRequest({
    kind: 'image',
    onPick: ([asset]: PickedAsset[]) => { if (asset) onPick(asset) },
  } as MediaRequest)
  const modal = request && (
    <MediaPickerModal request={request} folders={{ inline: 'portfolio' }} coverMinWidth={0} onClose={() => setRequest(null)} />
  )
  return { open, modal }
}

export function CompanyLogoField({ company, path, value, onChange }: {
  company: string
  path: string
  value: Portrait | null
  onChange: (value: Portrait | null) => void
}) {
  const { open, modal } = usePicker()
  const letter = company.trim()[0]?.toUpperCase() ?? '?'

  return (
    <fieldset className={styles.group}>
      <legend>Company logo</legend>
      <div className={styles.mediaRow}>
        {value
          ? <img className={styles.logoPreview} src={companyLogo(value.url, 160)} alt={value.alt} />
          : <div className={styles.logoLetter} aria-hidden="true">{letter}</div>}
        <div className={styles.grow}>
          <p className={styles.hint}>{value ? 'A transparent PNG or SVG looks best.' : `No logo yet, so the page shows the letter "${letter}".`}</p>
          <div className={styles.mediaButtons}>
            <button type="button" className={styles.add} onClick={() => open((asset) => onChange({ url: asset.url, alt: asset.alt || `${company} logo`, media_asset_id: asset.id }))}>
              {value ? 'Change logo' : 'Add logo'}
            </button>
            {value && <button type="button" className={styles.add} onClick={() => onChange(null)}>Remove</button>}
          </div>
          <FieldError path={`${path}.url`} />
        </div>
      </div>
      {modal}
    </fieldset>
  )
}

function CropDialog({ image, onSave, onClose }: {
  image: CompanyImage
  onSave: (crop: ImageCrop) => void
  onClose: () => void
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<ImageCrop | null>(image.crop)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className={styles.cropOverlay} role="dialog" aria-modal="true" aria-label="Position the image">
      <div className={styles.cropDialog}>
        <h3 className={styles.cropTitle}>Choose what visitors see</h3>
        <div className={styles.cropArea}>
          <Cropper
            image={image.url}
            crop={position}
            zoom={zoom}
            aspect={ASPECT}
            showGrid={false}
            initialCroppedAreaPercentages={image.crop ? {
              x: image.crop.x * 100,
              y: image.crop.y * 100,
              width: image.crop.width * 100,
              height: image.crop.height * 100,
            } : undefined}
            onCropChange={setPosition}
            onZoomChange={setZoom}
            onCropComplete={(percent) => setArea(toCrop(percent))}
          />
        </div>
        <label className={styles.cropZoom}>
          Zoom
          <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
        </label>
        <p className={styles.hint}>Drag the photo to move it. Your original file isn't changed.</p>
        <div className={styles.cropActions}>
          <button type="button" className={styles.add} onClick={onClose}>Cancel</button>
          <button type="button" className={styles.add} disabled={!area} onClick={() => { if (area) onSave(area) }}>Use this position</button>
        </div>
      </div>
    </div>
  )
}

export function CompanyImagesField({ company, path, value, onChange }: {
  company: string
  path: string
  value: CompanyImage[]
  onChange: (value: CompanyImage[]) => void
}) {
  const { open, modal } = usePicker()
  const [cropping, setCropping] = useState<number | null>(null)

  function add(asset: PickedAsset) {
    const next = [...value, { url: asset.url, alt: asset.alt || `At ${company}`, media_asset_id: asset.id, crop: null }]
    onChange(next)
    setCropping(next.length - 1)
  }

  return (
    <fieldset className={styles.group}>
      <legend>Company images ({value.length}/{MAX_IMAGES})</legend>
      <p className={styles.hint}>These appear when a visitor hovers over this job. With no image, the logo is shown at this size instead.</p>
      <div className={styles.mediaRow}>
        {value.map((image, i) => (
          <div key={`${image.url}-${i}`} className={styles.imageCard}>
            <img className={styles.imagePreview} src={companyImage(image.url, image.crop, 360)} alt={image.alt} />
            <div className={styles.mediaButtons}>
              <button type="button" className={styles.inlineBtn} onClick={() => setCropping(i)}>Adjust</button>
              <RowActions
                index={i}
                count={value.length}
                name={`image ${i + 1}`}
                onMove={(from, to) => onChange(moved(value, from, to))}
                onRemove={(index) => onChange(removed(value, index))}
              />
            </div>
            <TextField label="Describe the photo" path={`${path}[${i}].alt`} value={image.alt} onChange={(alt) => onChange(replaced(value, i, { ...image, alt }))} />
            <FieldError path={`${path}[${i}].crop`} />
          </div>
        ))}
      </div>
      <FieldError path={path} />
      <button type="button" className={styles.add} disabled={value.length >= MAX_IMAGES} onClick={() => open(add)}>+ Add image</button>
      {modal}
      {cropping !== null && value[cropping] && (
        <CropDialog
          image={value[cropping]}
          onSave={(crop) => {
            onChange(replaced(value, cropping, { ...value[cropping], crop }))
            setCropping(null)
          }}
          onClose={() => setCropping(null)}
        />
      )}
    </fieldset>
  )
}
