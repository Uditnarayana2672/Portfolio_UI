import { useAssetsStore } from '../../store/assetsStore'
import { useUiStore } from '../../store/uiStore'
import MediaCard from './MediaCard'
import EmptyState from '../ui/EmptyState'
import styles from './MediaGrid.module.css'

const DENSITY_MAP = { dense: '140px', comfy: '180px', roomy: '220px' } as const

export default function MediaGrid() {
  const assets  = useAssetsStore((s) => s.assets)
  const loading = useAssetsStore((s) => s.loading)
  const density = useUiStore((s) => s.gridDensity)

  const minSize = DENSITY_MAP[density]

  if (loading) {
    return (
      <div
        className={`${styles.grid} wobble`}
        style={{ '--grid-min': minSize } as React.CSSProperties}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.skeleton}>
            <div className={styles.skeletonThumb} />
            <div className={styles.skeletonMeta}>
              <div className={styles.skeletonLine} />
              <div className={`${styles.skeletonLine} ${styles.short}`} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!assets.length) {
    return <EmptyState />
  }

  return (
    <div
      className={`${styles.grid} wobble`}
      style={{ '--grid-min': minSize } as React.CSSProperties}
    >
      {assets.map((asset) => (
        <MediaCard key={asset.id} asset={asset} />
      ))}
    </div>
  )
}
