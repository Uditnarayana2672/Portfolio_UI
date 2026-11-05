import { useRef, useEffect, useState } from 'react'
import styles from './Dropzone.module.css'
import { useUploadsStore } from '../../store/uploadsStore'
import { useUpload } from '../../hooks/useUpload'

const FOLDERS = [
  'projects/thumbnails',
  'projects/diagrams',
  'projects/gallery',
  'projects/videos',
  'blog/covers',
  'blog/inline',
  'system/og-images',
  'system/avatars',
  'uncategorized',
]

export default function Dropzone() {
  const targetFolder = useUploadsStore((s) => s.targetFolder)
  const setTargetFolder = useUploadsStore((s) => s.setTargetFolder)
  const { enqueue, importFromUrl } = useUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length > 0) {
      enqueue(e.dataTransfer.files)
    }
  }

  const handleBrowse = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      enqueue(e.target.files)
      e.target.value = ''
    }
  }

  const handleImportUrl = () => {
    const url = window.prompt('Enter URL to import:')
    if (url?.trim()) importFromUrl(url.trim(), targetFolder)
  }

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files.length) {
        enqueue(e.clipboardData.files)
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [enqueue])

  return (
    <div
      className={`${styles.dropzone} wobble ${dragging ? styles.dragging : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <span className={styles.cornerTag}>POST /admin/media/upload</span>

      <div className={styles.dzLeft}>
        <h2>Drop files here to upload</h2>
        <p className={styles.hint}>
          or click <b>Browse</b> · paste from clipboard with <b>⌘V</b> · drag URL to import
        </p>
        <div className={styles.dzRules}>
          <span>Max <b>20 MB</b> images</span>
          <span>Max <b>200 MB</b> video</span>
          <span>Allowed: <b>jpg · png · webp · gif · mp4 · mov · webm · pdf</b></span>
        </div>
      </div>

      <div className={styles.dzRight}>
        <div className={styles.folderPick}>
          Target folder
          <select
            value={targetFolder}
            onChange={(e) => setTargetFolder(e.target.value)}
          >
            {FOLDERS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={handleBrowse}
        >
          <span className={styles.plus}>+</span> Browse files
        </button>
        <button className={styles.btn} onClick={handleImportUrl}>
          Import from URL
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.webm,.pdf"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
