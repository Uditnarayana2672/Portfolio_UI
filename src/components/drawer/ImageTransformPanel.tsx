import { useState, useRef } from 'react'
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import type { MediaAsset } from '../../types/media'
import styles from './ImageTransformPanel.module.css'

interface Props {
  asset: MediaAsset
}

const ASPECT_PRESETS = [
  { label: 'Free',         value: undefined },
  { label: '1:1',          value: 1 },
  { label: '4:3',          value: 4 / 3 },
  { label: '16:9',         value: 16 / 9 },
  { label: '3:2',          value: 3 / 2 },
  { label: 'og 1200×630',  value: 1200 / 630 },
]

const FORMAT_PRESETS = ['auto', 'webp', 'avif', 'jpg', 'png']

function extractCloudName(url: string | null): string {
  if (!url) return 'your-cloud'
  const m = url.match(/res\.cloudinary\.com\/([^/]+)/)
  return m?.[1] ?? 'your-cloud'
}

// ── Custom draggable slider ────────────────────────────────────────────────

interface SliderProps {
  label: string
  min: number
  max: number
  value: number
  onChange: (v: number) => void
}

function DragSlider({ label, min, max, value, onChange }: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const pct = ((value - min) / (max - min)) * 100
  const knobLeft = `calc(${pct}% - 6px)`

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    if (!trackRef.current) return
    const trackRect = trackRef.current.getBoundingClientRect()

    const move = (ev: MouseEvent) => {
      const p = Math.max(0, Math.min(1, (ev.clientX - trackRect.left) / trackRect.width))
      onChange(Math.round(min + p * (max - min)))
    }

    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', move)
    }, { once: true })
  }

  return (
    <div className={styles.xformRow}>
      <span className={styles.xformLabel}>{label}</span>
      <div
        ref={trackRef}
        className={styles.sliderTrack}
        onMouseDown={handleMouseDown}
      >
        <div className={styles.sliderFill} style={{ width: `${pct}%` }} />
        <div className={styles.sliderKnob} style={{ left: knobLeft }} />
      </div>
      <span className={styles.sliderVal}>{value}</span>
    </div>
  )
}

// ── Main panel ─────────────────────────────────────────────────────────────

export default function ImageTransformPanel({ asset }: Props) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [aspect, setAspect] = useState<number | undefined>(undefined)
  const [activeAspect, setActiveAspect] = useState<string>('Free')
  const [width, setWidth] = useState(asset.width ?? 800)
  const [quality, setQuality] = useState(80)
  const [format, setFormat] = useState('auto')
  const [urlCopied, setUrlCopied] = useState(false)

  const cloudName = extractCloudName(asset.cloudinary_url)
  const publicId = asset.public_id ?? ''

  const transformParts: string[] = [`w_${width}`, `q_${quality}`]
  if (format !== 'auto') transformParts.push(`f_${format}`)
  if (completedCrop?.width && completedCrop?.height) {
    transformParts.push(
      `c_crop,x_${Math.round(completedCrop.x)},y_${Math.round(completedCrop.y)}` +
      `,w_${Math.round(completedCrop.width)},h_${Math.round(completedCrop.height)}`
    )
  }
  const transformStr = transformParts.join(',')
  const transformedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${transformStr}/${publicId}`

  function handleAspectPreset(label: string, value: number | undefined) {
    setActiveAspect(label)
    setAspect(value)
    if (value === undefined) setCrop(undefined)
  }

  function copyTransformedUrl() {
    navigator.clipboard.writeText(transformedUrl).catch(() => {})
    setUrlCopied(true)
    setTimeout(() => setUrlCopied(false), 1200)
  }

  return (
    <div className={styles.section}>
      <h4 className={styles.heading}>
        Transform
        <span className={styles.headingTag}>image only</span>
      </h4>

      {/* Crop area */}
      {asset.cloudinary_url ? (
        <div className={styles.cropWrap}>
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
          >
            <img
              className={styles.cropImg}
              src={asset.cloudinary_url}
              alt={asset.alt_text || ''}
            />
          </ReactCrop>
        </div>
      ) : (
        <div className={styles.cropPlaceholder}>No preview available</div>
      )}

      {/* Aspect ratio presets */}
      <div className={styles.presetRow}>
        {ASPECT_PRESETS.map(({ label, value }) => (
          <button
            key={label}
            className={`${styles.pst}${activeAspect === label ? ' ' + styles.pstActive : ''}`}
            onClick={() => handleAspectPreset(label, value)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom sliders */}
      <DragSlider
        label="Width"
        min={100}
        max={3000}
        value={width}
        onChange={setWidth}
      />
      <DragSlider
        label="Quality"
        min={10}
        max={100}
        value={quality}
        onChange={setQuality}
      />

      {/* Format presets */}
      <div className={styles.formatRow}>
        {FORMAT_PRESETS.map((f) => (
          <button
            key={f}
            className={`${styles.pst}${format === f ? ' ' + styles.pstActive : ''}`}
            onClick={() => setFormat(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Transformed URL */}
      <div className={styles.transformedUrl}>
        <div className={styles.transformLabel}>Transformed URL</div>
        <div className={styles.urlRow}>
          <span className={styles.urlText} title={transformedUrl}>
            https://res.cloudinary.com/{cloudName}/image/upload/
            <strong>{transformStr}</strong>
            /{publicId}
          </span>
          <button
            className={`${styles.copyBtn}${urlCopied ? ' ' + styles.copied : ''}`}
            onClick={copyTransformedUrl}
            title="Copy transformed URL"
          >
            {urlCopied ? '✓' : '⎘'}
          </button>
        </div>
      </div>
    </div>
  )
}
