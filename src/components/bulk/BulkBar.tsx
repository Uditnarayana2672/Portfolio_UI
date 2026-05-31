import { useUiStore } from '../../store/uiStore'
import styles from './BulkBar.module.css'

export default function BulkBar() {
  const selectedAssets = useUiStore((s) => s.selectedAssets)

  if (selectedAssets.length === 0) return null

  return (
    <div className={`${styles.bulkBar} wobble`}>
      <span className={styles.countBadge}>{selectedAssets.length} SELECTED</span>
      <span>Apply action to selected assets</span>
      <div className={styles.bulkBtns}>
        <button className={styles.bulkBtn}>Move to folder…</button>
        <button className={styles.bulkBtn}>Edit alt text</button>
        <button className={styles.bulkBtn}>Copy URLs</button>
        <button className={styles.bulkBtn}>Download</button>
        <button className={`${styles.bulkBtn} ${styles.danger}`}>Delete</button>
      </div>
    </div>
  )
}
