import { useState } from 'react'
import type { MediaAsset } from '../../types/media'
import { useDrawerForm } from '../../context/DrawerFormContext'
import styles from './AssetFields.module.css'

const FOLDERS = [
  'blog/covers',
  'blog/inline',
  'projects/thumbnails',
  'projects/diagrams',
  'system/og-images',
  'system/avatars',
  'uncategorized',
]

interface Props {
  asset: MediaAsset
}

export default function AssetFields({ asset }: Props) {
  const { altText, setAltText, folder, setFolder, isDirty, isSaving, save } = useDrawerForm()
  const [copied, setCopied] = useState(false)

  const url = asset.cloudinary_url ?? `(no URL — ${asset.public_id ?? 'no public_id'})`

  function handleCopy() {
    navigator.clipboard.writeText(asset.cloudinary_url ?? '').catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <>
      {/* URL row */}
      <div className={styles.field}>
        <div className={styles.fieldLabel}>URL</div>
        <div className={styles.urlRow}>
          <span className={styles.urlText} title={url}>{url}</span>
          <button
            className={`${styles.copyBtn}${copied ? ' ' + styles.copied : ''}`}
            onClick={handleCopy}
            title="Copy URL"
          >
            {copied ? '✓ copied' : '⎘'}
          </button>
        </div>
      </div>

      {/* Filename — read-only */}
      <div className={styles.field}>
        <div className={styles.fieldLabel}>Filename</div>
        <input
          className={styles.input}
          type="text"
          value={asset.file_name ?? ''}
          readOnly
          title="Re-upload to rename"
        />
      </div>

      {/* Folder */}
      <div className={styles.field}>
        <div className={styles.fieldLabel}>Folder</div>
        <select
          className={styles.select}
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
        >
          {FOLDERS.includes(folder) ? null : (
            <option value={folder}>{folder}</option>
          )}
          {FOLDERS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Alt text */}
      <div className={styles.field}>
        <div className={styles.fieldLabel}>Alt text</div>
        <textarea
          className={styles.textarea}
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="Describe this asset for screen readers…"
        />
      </div>

      {/* Save — only shown when dirty */}
      {isDirty && (
        <button
          className={styles.saveBtn}
          disabled={isSaving}
          onClick={() => save()}
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      )}
    </>
  )
}
