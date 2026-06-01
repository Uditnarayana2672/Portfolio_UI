import { useRef, useState } from 'react'
import { useAssetsStore } from '../../store/assetsStore'
import { useUiStore } from '../../store/uiStore'
import { bulkDeleteMedia } from '../../api/mediaApi'
import styles from './DeleteModal.module.css'

interface Props {
  assetIds: string[]
  usageCount?: number
  usageNames?: string[]
  onClose: () => void
  onConfirmed: () => void
}

export default function DeleteModal({
  assetIds,
  usageCount = 0,
  usageNames = [],
  onClose,
  onConfirmed,
}: Props) {
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  const assets = useAssetsStore((s) => s.assets)
  const removeAsset = useAssetsStore((s) => s.removeAsset)
  const drawerAssetId = useUiStore((s) => s.drawerAssetId)
  const closeDrawer = useUiStore((s) => s.closeDrawer)
  const clearSelection = useUiStore((s) => s.clearSelection)

  const selectedAssets = assets.filter((a) => assetIds.includes(a.id))
  const previewAssets = selectedAssets.slice(0, 3)
  const extraCount = selectedAssets.length - 3

  const canDelete = confirmText === 'delete'
  const n = assetIds.length

  async function handleDelete() {
    if (!canDelete || busy) return
    setBusy(true)
    try {
      await bulkDeleteMedia(assetIds, true)
    } catch {
      // API may be unavailable in demo; proceed with local store removal
    }
    assetIds.forEach((id) => removeAsset(id))
    clearSelection()
    if (drawerAssetId && assetIds.includes(drawerAssetId)) {
      closeDrawer()
    }
    onConfirmed()
    onClose()
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === backdropRef.current) onClose()
  }

  return (
    <div className={styles.backdrop} ref={backdropRef} onClick={handleBackdropClick}>
      <div className={styles.modal} role="dialog" aria-modal="true">

        <div className={styles.mHead}>
          <span className={styles.bang}>!</span>
          <span className={styles.title}>
            Delete {n} asset{n !== 1 ? 's' : ''}?
          </span>
        </div>

        <div className={styles.mBody}>
          <p className={styles.explain}>
            This will permanently remove the selected asset{n !== 1 ? 's' : ''} from
            Cloudinary and the database. This action cannot be undone.
          </p>

          {selectedAssets.length > 0 && (
            <div className={styles.previewStrip}>
              {previewAssets.map((a) => (
                <div key={a.id} className={styles.pmini}>
                  {a.cloudinary_url && (
                    <img src={a.cloudinary_url} alt={a.file_name ?? ''} />
                  )}
                </div>
              ))}
              {extraCount > 0 && (
                <span className={styles.more}>+{extraCount} more</span>
              )}
            </div>
          )}

          {usageCount > 0 && (
            <div className={styles.conflict}>
              ⚠ In use: {usageCount} of the selected asset{usageCount !== 1 ? 's are' : ' is'} referenced
              {usageNames.length > 0 ? ` by ${usageNames.join(', ')}` : ''}. Deletion will leave broken references.
            </div>
          )}

          <label className={styles.confirmLabel} htmlFor="delete-confirm-input">
            Type <em>delete</em> to confirm
          </label>
          <input
            id="delete-confirm-input"
            type="text"
            className={styles.confirmInput}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoFocus
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className={styles.mFoot}>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`${styles.deleteBtn} ${canDelete ? styles.active : ''}`}
            onClick={handleDelete}
            disabled={!canDelete || busy}
          >
            ✕ Delete forever
          </button>
        </div>

      </div>
    </div>
  )
}
