import type { MediaAsset } from '../../types/media'
import styles from './AssetPreview.module.css'

interface Props {
  asset: MediaAsset
}

function formatResTag(asset: MediaAsset): string {
  if (asset.resource_type === 'raw') {
    return asset.width ? `${asset.width} pages` : '—'
  }
  if (asset.width && asset.height) {
    const mb = asset.file_size ? (asset.file_size / (1024 * 1024)).toFixed(1) + ' MB' : ''
    return mb ? `${asset.width}×${asset.height} · ${mb}` : `${asset.width}×${asset.height}`
  }
  return '—'
}

function getTypeTag(asset: MediaAsset): string {
  return (asset.format || asset.resource_type).toUpperCase()
}

export default function AssetPreview({ asset }: Props) {
  const bgClass =
    asset.resource_type === 'video' ? styles.video
    : asset.resource_type === 'raw' ? styles.raw
    : styles.image

  const typeTagMod =
    asset.resource_type === 'video' ? styles.typeTagVideo
    : asset.resource_type === 'raw' ? styles.typeTagRaw
    : ''

  return (
    <div className={`${styles.preview} ${bgClass}`}>
      {asset.resource_type === 'image' && asset.cloudinary_url && (
        <img
          className={styles.img}
          src={asset.cloudinary_url}
          loading="lazy"
          alt={asset.alt_text || ''}
        />
      )}

      {asset.resource_type === 'video' && asset.cloudinary_url && (
        <video className={styles.videoEl} src={asset.cloudinary_url} controls />
      )}

      {(asset.resource_type === 'raw' ||
        (asset.resource_type === 'video' && !asset.cloudinary_url)) && (
        <span className={styles.docGlyph}>
          {asset.resource_type === 'video' ? '[ video ]' : '[ doc ]'}
        </span>
      )}

      <span className={styles.resTag}>{formatResTag(asset)}</span>
      <span className={`${styles.typeTag} ${typeTagMod}`}>{getTypeTag(asset)}</span>
    </div>
  )
}
