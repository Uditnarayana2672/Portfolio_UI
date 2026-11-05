import { useRef, useState, type DragEvent, type ReactNode } from 'react'
import { uploadMedia } from '../../api/mediaApi'
import styles from './UploadZone.module.css'

interface UploadZoneProps {
  onComplete: (url: string) => void
  folder?: string
  accept?: string
  resourceType?: string
  value?: string
  compact?: boolean
  label?: string
  hint?: string
  note?: ReactNode
  className?: string
}

export default function UploadZone({
  onComplete,
  folder = 'projects',
  accept = 'image/*',
  resourceType = 'image',
  value,
  compact = false,
  label,
  hint,
  note,
  className,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  async function upload(file: File) {
    setUploadError(null)
    setProgress(0)
    try {
      const res = await uploadMedia(file, folder, { resource_type: resourceType }, setProgress)
      setProgress(null)
      const url = res.asset.cloudinary_url ?? ''
      if (url) onComplete(url)
    } catch (err) {
      setProgress(null)
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  function openPicker() {
    inputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) upload(file)
    e.target.value = ''   // reset so same file can be re-selected
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) upload(file)
  }

  const busy = progress !== null

  const glyph = busy ? '↺' : value ? '✓' : '⬆'
  const text  = busy
    ? `Uploading ${progress}%…`
    : value
      ? (value.split('/').pop() ?? value)
      : compact
        ? 'upload OG image · 1200 × 630'
        : 'drop image or click to upload'

  const rootClass = [styles.fg, className].filter(Boolean).join(' ')
  const zoneClass = [
    styles.uploadZone,
    compact  ? styles.compact  : '',
    value    ? styles.uploaded  : '',
    dragging ? styles.dragging  : '',
    busy     ? styles.busy      : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={rootClass}>
      {label && (
        <span className={styles.fl}>
          {label}
          {hint && <span className={styles.hint}>{hint}</span>}
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div
        className={zoneClass}
        role="button"
        tabIndex={busy ? -1 : 0}
        onClick={busy ? undefined : openPicker}
        onKeyDown={(e) => !busy && e.key === 'Enter' && openPicker()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span className={`${styles.uglyph}${busy ? ` ${styles.spin}` : ''}`}>{glyph}</span>
        <span className={styles.utxt}>{text}</span>
        {busy && (
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {uploadError && <div className={styles.errorNote}>{uploadError}</div>}
      {!uploadError && note && <div className={styles.fieldNote}>{note}</div>}
    </div>
  )
}
