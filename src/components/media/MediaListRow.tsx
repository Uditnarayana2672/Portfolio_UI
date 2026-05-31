import { useSearchParams } from 'react-router-dom'
import { useUiStore } from '../../store/uiStore'
import type { MediaAsset } from '../../types/media'
import styles from './MediaListRow.module.css'

interface Props {
  asset: MediaAsset
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = diff / 3_600_000
  if (h < 1) return 'just now'
  if (h < 24) return `${Math.floor(h)}h ago`
  if (h < 48) return 'yesterday'
  return `${Math.floor(h / 24)}d ago`
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getDimensions(asset: MediaAsset): string {
  if (asset.resource_type === 'raw') {
    return asset.width ? `${asset.width} pages` : '—'
  }
  if (asset.resource_type === 'video') {
    return formatDuration(asset.video_duration_seconds)
  }
  if (asset.width && asset.height) return `${asset.width} × ${asset.height}`
  return '—'
}

function getTypeTag(asset: MediaAsset): string {
  return (asset.format || asset.resource_type).toUpperCase()
}

export default function MediaListRow({ asset }: Props) {
  const [, setSearchParams] = useSearchParams()
  const selectedAssets    = useUiStore((s) => s.selectedAssets)
  const drawerAssetId     = useUiStore((s) => s.drawerAssetId)
  const toggleSelect      = useUiStore((s) => s.toggleSelect)
  const openDrawer        = useUiStore((s) => s.openDrawer)
  const openDeleteConfirm = useUiStore((s) => s.openDeleteConfirm)

  const isSelected = selectedAssets.includes(asset.id)
  const isOpened   = drawerAssetId === asset.id
  const isOrphan   = asset.is_orphan

  const rowCls = [
    styles.row,
    isSelected ? styles.selected : '',
    isOpened   ? styles.active   : '',
    isOrphan   ? styles.orphan   : '',
  ].filter(Boolean).join(' ')

  const thumbCls = [
    styles.thumb,
    styles[`thumb_${asset.resource_type}` as keyof typeof styles] || '',
    isOrphan ? styles.thumb_orphan : '',
  ].filter(Boolean).join(' ')

  const typeBadgeCls = [
    styles.typeBadge,
    asset.resource_type === 'video' ? styles.badgeVideo : '',
    asset.resource_type === 'raw'   ? styles.badgeRaw   : '',
  ].filter(Boolean).join(' ')

  function handleRowClick() {
    openDrawer(asset.id)
    setSearchParams({ asset: asset.id })
  }

  function handleCheck(e: React.MouseEvent) {
    e.stopPropagation()
    toggleSelect(asset.id)
  }

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    if (asset.cloudinary_url) navigator.clipboard.writeText(asset.cloudinary_url)
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    openDeleteConfirm([asset.id])
  }

  return (
    <div className={rowCls} onClick={handleRowClick}>

      {/* [1] Checkbox */}
      <div
        className={`${styles.checkbox} ${isSelected ? styles.checkSelected : ''}`}
        onClick={handleCheck}
      >
        {isSelected && <span className={styles.checkMark}>✓</span>}
      </div>

      {/* [2] Mini thumbnail */}
      <div className={thumbCls}>
        {isOrphan && <span className={styles.thumbGlyph}>!</span>}
        {!isOrphan && asset.resource_type === 'video' && (
          <span className={styles.miniPlay} />
        )}
        {!isOrphan && asset.resource_type === 'raw' && (
          <span className={styles.rawLabel}>PDF</span>
        )}
      </div>

      {/* [3] Name + folder */}
      <div className={styles.nameCell} style={{ minWidth: 0 }}>
        <div className={styles.fileName}>{asset.file_name || '(untitled)'}</div>
        <div className={styles.folderName}>{asset.folder}</div>
      </div>

      {/* [4] Type badge */}
      <div>
        <span className={typeBadgeCls}>{isOrphan ? '404' : getTypeTag(asset)}</span>
      </div>

      {/* [5] Dimensions */}
      <div className={styles.meta}>{isOrphan ? '—' : getDimensions(asset)}</div>

      {/* [6] Size */}
      <div className={styles.meta}>{formatFileSize(asset.file_size)}</div>

      {/* [7] Date */}
      <div className={styles.meta}>{formatDate(asset.created_at)}</div>

      {/* [8] Actions */}
      <div className={styles.actions}>
        <button className={styles.actBtn} onClick={handleCopy} title="Copy URL">⎘</button>
        <button className={`${styles.actBtn} ${styles.actDanger}`} onClick={handleDelete} title="Delete">×</button>
      </div>

    </div>
  )
}
