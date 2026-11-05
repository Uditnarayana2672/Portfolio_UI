import { useAssetsStore } from '../../store/assetsStore'
import MediaListRow from './MediaListRow'
import EmptyState from '../ui/EmptyState'
import styles from './MediaList.module.css'

export default function MediaList() {
  const assets  = useAssetsStore((s) => s.assets)
  const loading = useAssetsStore((s) => s.loading)

  if (loading) {
    return (
      <div className={`${styles.list} wobble`}>
        <div className={styles.header}>
          <span />
          <span />
          <span>Name / Folder</span>
          <span>Type</span>
          <span>Dimensions</span>
          <span>Size</span>
          <span>Date</span>
          <span />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.skeletonRow}>
            <div className={styles.skeletonCell} style={{ width: 22, height: 22 }} />
            <div className={styles.skeletonCell} style={{ width: 48, height: 36 }} />
            <div className={styles.skeletonCell} style={{ height: 14, flex: 1 }} />
            <div className={styles.skeletonCell} style={{ width: 48, height: 14 }} />
            <div className={styles.skeletonCell} style={{ width: 80, height: 14 }} />
            <div className={styles.skeletonCell} style={{ width: 52, height: 14 }} />
            <div className={styles.skeletonCell} style={{ width: 64, height: 14 }} />
            <div className={styles.skeletonCell} style={{ width: 52, height: 24 }} />
          </div>
        ))}
      </div>
    )
  }

  if (!assets.length) {
    return <EmptyState />
  }

  return (
    <div className={`${styles.list} wobble`}>
      {/* Sticky header */}
      <div className={styles.header}>
        <span>☐</span>
        <span>·</span>
        <span>Name / Folder</span>
        <span>Type</span>
        <span>Dimensions</span>
        <span>Size</span>
        <span>Date</span>
        <span>·</span>
      </div>

      {assets.map((asset) => (
        <MediaListRow key={asset.id} asset={asset} />
      ))}
    </div>
  )
}
