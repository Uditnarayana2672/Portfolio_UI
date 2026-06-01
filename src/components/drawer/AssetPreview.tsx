import { useState } from 'react'
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
  if (asset.source_type === 'youtube') return 'YOUTUBE'
  return (asset.format || asset.resource_type).toUpperCase()
}

export default function AssetPreview({ asset }: Props) {
  const [playing, setPlaying] = useState(false)

  const bgClass =
    asset.resource_type === 'video' ? styles.video
      : asset.resource_type === 'raw' ? styles.raw
        : styles.image

  const typeTagMod =
    asset.resource_type === 'video' ? styles.typeTagVideo
      : asset.resource_type === 'raw' ? styles.typeTagRaw
        : ''

  const isYouTube = asset.source_type === 'youtube' && !!asset.external_id
  // A poster image to show before playback / for non-cloudinary assets.
  const poster = asset.cloudinary_url ?? asset.thumbnail_url

  return (
    <div className={`${styles.preview} ${bgClass}`}>
      {/* YouTube: poster thumbnail → click to play the embedded player */}
      {isYouTube && (
        playing ? (
          <iframe
            className={styles.iframe}
            src={`https://www.youtube.com/embed/${asset.external_id}?autoplay=1`}
            title={asset.video_title || asset.file_name || 'YouTube video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className={styles.playWrap}
            onClick={() => setPlaying(true)}
            aria-label="Play video"
          >
            {poster ? (
              <img className={styles.img} src={poster} loading="lazy" alt={asset.alt_text || ''} />
            ) : (
              <span className={styles.docGlyph}>[ video ]</span>
            )}
            <span className={styles.playBadge}>▶</span>
          </button>
        )
      )}

      {/* Cloudinary image */}
      {!isYouTube && asset.resource_type === 'image' && poster && (
        <img className={styles.img} src={poster} loading="lazy" alt={asset.alt_text || ''} />
      )}

      {/* Cloudinary-hosted video */}
      {!isYouTube && asset.resource_type === 'video' && asset.cloudinary_url && (
        <video className={styles.videoEl} src={asset.cloudinary_url} poster={asset.thumbnail_url ?? undefined} controls />
      )}

      {/* Fallbacks: raw docs, or anything with no playable URL */}
      {!isYouTube &&
        asset.resource_type === 'raw' &&
        (poster ? (
          <img className={styles.img} src={poster} loading="lazy" alt={asset.alt_text || ''} />
        ) : (
          <span className={styles.docGlyph}>[ doc ]</span>
        ))}

      {!isYouTube && asset.resource_type === 'video' && !asset.cloudinary_url && (
        poster ? (
          <img className={styles.img} src={poster} loading="lazy" alt={asset.alt_text || ''} />
        ) : (
          <span className={styles.docGlyph}>[ video ]</span>
        )
      )}

      <span className={styles.resTag}>{formatResTag(asset)}</span>
      <span className={`${styles.typeTag} ${typeTagMod}`}>{getTypeTag(asset)}</span>
    </div>
  )
}
