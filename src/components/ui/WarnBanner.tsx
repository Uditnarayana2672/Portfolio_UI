import { useAssetsStore } from '../../store/assetsStore'
import styles from './WarnBanner.module.css'

// Storage usage at or above this percentage surfaces the banner.
const WARN_THRESHOLD = 75

export default function WarnBanner() {
  const stats = useAssetsStore((s) => s.stats)
  const storage = stats?.storage
  const cleanup = stats?.last_cleanup

  // Only show the banner when there is something worth flagging: high storage
  // usage or a recent orphan-cleanup run.
  const storageWarn = !!storage && storage.percent_used >= WARN_THRESHOLD
  if (!storageWarn && !cleanup) return null

  return (
    <div className={`${styles.warnBanner} wobble`}>
      <span className={styles.badge}>Cloudinary</span>
      <span>
        {storage && (
          <>Storage at <b>{storage.percent_used}%</b></>
        )}
        {storage && cleanup && ' · '}
        {cleanup && (
          <>
            orphan cleanup freed {cleanup.freed_human} ({cleanup.orphans_removed} removed)
          </>
        )}
      </span>
      <div className={styles.right}>
        <button className={styles.modBtn}>Run cleanup now</button>
        <button className={styles.modBtn}>Upgrade plan</button>
      </div>
    </div>
  )
}
