import type { MediaAsset } from '../../types/media'
import styles from './AssetMetadata.module.css'

interface Props {
  asset: MediaAsset
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

function aspectRatio(w: number, h: number): string {
  const STANDARD: [number, number, string][] = [
    [16, 9, '16:9'], [4, 3, '4:3'], [1, 1, '1:1'],
    [3, 2, '3:2'], [21, 9, '21:9'], [9, 16, '9:16'],
  ]
  for (const [rw, rh, label] of STANDARD) {
    if (Math.abs(w / h - rw / rh) < 0.02) return label
  }
  const d = gcd(w, h)
  return `${w / d}:${h / d}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export default function AssetMetadata({ asset }: Props) {
  const typeLabel =
    `${asset.resource_type} · ${asset.format ?? '—'}`

  const dimsLabel =
    asset.width && asset.height
      ? `${asset.width} × ${asset.height}  (${aspectRatio(asset.width, asset.height)})`
      : '—'

  const sizeLabel =
    asset.file_size != null
      ? `${asset.file_size.toLocaleString()} bytes`
      : '—'

  return (
    <div className={styles.section}>
      <h4 className={styles.heading}>Metadata</h4>
      <dl className={styles.kvGrid}>
        <dt>Public ID</dt>
        <dd title={asset.public_id ?? '—'}>{asset.public_id ?? '—'}</dd>

        <dt>Type</dt>
        <dd>{typeLabel}</dd>

        <dt>Dimensions</dt>
        <dd>{dimsLabel}</dd>

        <dt>Size</dt>
        <dd>{sizeLabel}</dd>

        <dt>Uploaded by</dt>
        <dd>{asset.uploaded_by_name ?? '—'}</dd>

        <dt>Created</dt>
        <dd>{formatDate(asset.created_at)}</dd>
      </dl>
    </div>
  )
}
