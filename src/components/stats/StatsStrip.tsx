import MiniStat from './MiniStat'
import { useAssetsStore } from '../../store/assetsStore'
import styles from './StatsStrip.module.css'

export default function StatsStrip() {
  const total      = useAssetsStore((s) => s.total)
  const typeStats  = useAssetsStore((s) => s.typeStats)
  const stats      = useAssetsStore((s) => s.stats)

  // Prefer the authoritative per-type counts from /media/stats, falling back to
  // the type_stats returned alongside the current page of the list endpoint.
  const counts  = stats?.counts ?? typeStats
  const images  = counts.image ?? 0
  const videos  = counts.video ?? 0
  const raw     = counts.raw ?? 0
  const totalAssets = stats?.total_assets ?? total

  const addedToday = stats?.added_today ?? 0
  const storage    = stats?.storage

  return (
    <div className={`${styles.statsRow} wobble`}>
      <MiniStat
        label="Total assets"
        num={totalAssets}
        sub={addedToday > 0 ? `▲ ${addedToday} today` : 'no new today'}
        subVariant={addedToday > 0 ? 'up' : undefined}
        variant="dark"
      />
      <MiniStat label="Images"     num={images} sub="jpg · png · webp" />
      <MiniStat label="Videos"     num={videos} sub="mp4 · mov · webm" />
      <MiniStat label="Raw / docs" num={raw}    sub="pdf · zip · other" />
      <MiniStat
        label="Storage"
        num={storage ? storage.used_human : '—'}
        numCaption={storage ? ` / ${storage.quota_human}` : ''}
        variant="storage"
        storagePercent={storage?.percent_used ?? 0}
      />
    </div>
  )
}
