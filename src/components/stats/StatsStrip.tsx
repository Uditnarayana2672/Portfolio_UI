import MiniStat from './MiniStat'
import styles from './StatsStrip.module.css'

// Mock data — will be replaced with real store data in integration stage
const STORAGE_USED_GB  = 1.4
const STORAGE_CAP_GB   = 2.25
const STORAGE_PERCENT  = Math.round((STORAGE_USED_GB / STORAGE_CAP_GB) * 100) // 62

export default function StatsStrip() {
  return (
    <div className={`${styles.statsRow} wobble`}>
      <MiniStat label="Total assets" num={84}  sub="▲ 4 today"         subVariant="up" variant="dark" />
      <MiniStat label="Images"       num={71}  sub="jpg · png · webp" />
      <MiniStat label="Videos"       num={9}   sub="mp4 · mov · webm" />
      <MiniStat label="Raw / docs"   num={4}   sub="pdf" />
      <MiniStat
        label="Storage"
        num={`${STORAGE_USED_GB}`}
        numCaption={` / ${STORAGE_CAP_GB} GB`}
        variant="storage"
        storagePercent={STORAGE_PERCENT}
      />
    </div>
  )
}
