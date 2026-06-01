import { useState } from 'react'
import { useUiStore } from '../../store/uiStore'
import { getMediaUsage } from '../../api/mediaApi'
import styles from './BulkBar.module.css'

export default function BulkBar() {
  const selectedAssets     = useUiStore((s) => s.selectedAssets)
  const openDeleteConfirm  = useUiStore((s) => s.openDeleteConfirm)
  const [fetching, setFetching] = useState(false)

  if (selectedAssets.length === 0) return null

  async function handleDeleteClick() {
    setFetching(true)
    let conflictCount = 0
    try {
      // Fetch usage for each selected asset to determine conflict count
      const usageResults = await Promise.allSettled(
        selectedAssets.map((id) => getMediaUsage(id))
      )
      conflictCount = usageResults.filter(
        (r) => r.status === 'fulfilled' && r.value.references.length > 0
      ).length
    } catch {
      // If usage check fails, proceed without conflict info
    }
    setFetching(false)
    openDeleteConfirm([...selectedAssets], conflictCount)
  }

  return (
    <div className={`${styles.bulkBar} wobble`}>
      <span className={styles.countBadge}>{selectedAssets.length} SELECTED</span>
      <span>Apply action to selected assets</span>
      <div className={styles.bulkBtns}>
        <button className={styles.bulkBtn}>Move to folder…</button>
        <button className={styles.bulkBtn}>Edit alt text</button>
        <button className={styles.bulkBtn}>Copy URLs</button>
        <button className={styles.bulkBtn}>Download</button>
        <button
          className={`${styles.bulkBtn} ${styles.danger}`}
          onClick={handleDeleteClick}
          disabled={fetching}
        >
          {fetching ? 'Checking…' : 'Delete'}
        </button>
      </div>
    </div>
  )
}
