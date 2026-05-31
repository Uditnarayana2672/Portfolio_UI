import { useSearchParams } from 'react-router-dom'
import { useUiStore } from '../../store/uiStore'
import type { MediaAsset } from '../../types/media'
import styles from './MediaCard.module.css'

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

function getResTag(asset: MediaAsset): string {
  if (asset.resource_type === 'raw') {
    return asset.width ? `${asset.width} pages` : '—'
  }
  if (asset.width && asset.height) return `${asset.width} × ${asset.height}`
  return '—'
}

function getTypeTag(asset: MediaAsset): string {
  return (asset.format || asset.resource_type).toUpperCase()
}

function getLabelGlyph(asset: MediaAsset): string {
  if (asset.resource_type === 'raw') return '[ doc ]'
  if (asset.resource_type === 'video') return ''
  const f = asset.folder || ''
  if (f.includes('og-image')) return '[ og-card ]'
  if (f.includes('avatar')) return '[ avatar ]'
  if (f.includes('diagram')) return '[ diagram ]'
  return '[ photo ]'
}

function getShortname(publicId: string | null): string {
  if (!publicId) return ''
  const seg = publicId.split('/').pop() || ''
  return seg.toUpperCase()
}

export default function MediaCard({ asset }: Props) {
  const [, setSearchParams] = useSearchParams()
  const selectedAssets = useUiStore((s) => s.selectedAssets)
  const drawerAssetId  = useUiStore((s) => s.drawerAssetId)
  const toggleSelect   = useUiStore((s) => s.toggleSelect)
  const openDrawer     = useUiStore((s) => s.openDrawer)
  const openDeleteConfirm = useUiStore((s) => s.openDeleteConfirm)

  const isSelected = selectedAssets.includes(asset.id)
  const isOpened   = drawerAssetId === asset.id
  const isOrphan   = asset.is_orphan

  const cardCls = [
    styles.card,
    isSelected ? styles.selected : '',
    isOpened   ? styles.opened   : '',
    isOrphan   ? styles.failed   : '',
  ].filter(Boolean).join(' ')

  const thumbCls = [
    styles.thumb,
    styles[asset.resource_type as 'image' | 'video' | 'raw'] || '',
  ].filter(Boolean).join(' ')

  const typeTagCls = [
    styles.typeTag,
    asset.resource_type === 'video' ? styles.video : '',
    asset.resource_type === 'raw'   ? styles.raw   : '',
  ].filter(Boolean).join(' ')

  function handleCardClick() {
    openDrawer(asset.id)
    setSearchParams({ asset: asset.id })
  }

  function handleCheck(e: React.MouseEvent) {
    e.stopPropagation()
    toggleSelect(asset.id)
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    openDeleteConfirm([asset.id])
  }

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    if (asset.cloudinary_url) {
      navigator.clipboard.writeText(asset.cloudinary_url)
    }
  }

  const labelGlyph = getLabelGlyph(asset)

  return (
    <div className={cardCls} onClick={handleCardClick}>

      {/* Checkbox */}
      <div className={styles.check} onClick={handleCheck} />

      {/* Quick row */}
      <div className={styles.quickRow}>
        <button className={styles.qb} onClick={handleCopy} title="Copy URL">⎘</button>
        <button className={`${styles.qb} ${styles.danger}`} onClick={handleDelete} title="Delete">×</button>
      </div>

      {/* Thumbnail */}
      <div className={thumbCls}>

        {/* Label glyph — sits in grid flow, below the img overlay */}
        {labelGlyph && (
          <span className={styles.labelGlyph}>
            {isOrphan ? '[ missing ]' : labelGlyph}
          </span>
        )}
        {isOrphan && !labelGlyph && (
          <span className={styles.labelGlyph}>[ missing ]</span>
        )}

        {/* Real image — covers label glyph once loaded */}
        {asset.resource_type === 'image' && asset.cloudinary_url && !isOrphan && (
          <img
            src={asset.cloudinary_url}
            loading="lazy"
            alt={asset.alt_text || ''}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
          />
        )}

        {/* Video: play button + duration */}
        {asset.resource_type === 'video' && (
          <>
            <div className={styles.playTri} />
            <span className={styles.videoDuration}>{formatDuration(asset.video_duration_seconds)}</span>
          </>
        )}

        {/* Overlay tags (above img via DOM order) */}
        <span className={styles.resTag}>{isOrphan ? '—' : getResTag(asset)}</span>
        <span className={typeTagCls}>{isOrphan ? '404' : getTypeTag(asset)}</span>
        {!isOrphan && (
          <span className={styles.placeholderTag}>{getShortname(asset.public_id)}</span>
        )}
      </div>

      {/* Meta */}
      <div className={styles.meta}>
        <div className={styles.fname}>{asset.file_name || '(untitled)'}</div>
        <div className={styles.subMeta}>
          <span>{formatFileSize(asset.file_size)}</span>
          <span>{formatDate(asset.created_at)}</span>
        </div>
        <div className={styles.folderLine}>{asset.folder}</div>
      </div>

    </div>
  )
}
