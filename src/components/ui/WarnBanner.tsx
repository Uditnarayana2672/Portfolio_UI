import styles from './WarnBanner.module.css'

// Hardcoded visible — will be conditionally rendered in integration stage
export default function WarnBanner() {
  return (
    <div className={`${styles.warnBanner} wobble`}>
      <span className={styles.badge}>Cloudinary</span>
      <span>
        Storage at <b>62%</b> · 1 orphan cleanup job ran overnight (freed 184 MB).
      </span>
      <div className={styles.right}>
        <button className={styles.modBtn}>Run cleanup now</button>
        <button className={styles.modBtn}>Upgrade plan</button>
      </div>
    </div>
  )
}
