import { memo } from 'react'
import styles from './UploadRow.module.css'
import { useUploadsStore } from '../../store/uploadsStore'
import type { UploadItem } from '../../types/media'

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif'])
const VIDEO_EXTS = new Set(['mp4', 'mov', 'webm'])

function getExt(name: string) {
  return name.split('.').pop()?.toUpperCase() ?? '??'
}

function getBadgeType(name: string): 'image' | 'video' | 'raw' {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (IMAGE_EXTS.has(ext)) return 'image'
  if (VIDEO_EXTS.has(ext)) return 'video'
  return 'raw'
}

function formatSize(bytes: number): string {
  if (!bytes) return '— —'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type Props = { item: UploadItem }

export default memo(function UploadRow({ item }: Props) {
  const removeItem = useUploadsStore((s) => s.removeItem)

  const isError = item.status === 'error' || item.status === 'failed'
  const ext = getExt(item.file.name)
  const badgeType = isError ? 'err' : getBadgeType(item.file.name)

  const ftypeClass = [
    styles.ftype,
    badgeType === 'image' ? styles.ftypeImage : '',
    badgeType === 'video' ? styles.ftypeVideo : '',
    badgeType === 'err'   ? styles.ftypeErr   : '',
  ].filter(Boolean).join(' ')

  const pfillClass = isError
    ? `${styles.pfill} ${styles.pfillFailed}`
    : styles.pfill

  const pstateClass = [
    styles.pstate,
    item.status === 'done' ? styles.pstateDone : '',
    isError                ? styles.pstateErr  : '',
  ].filter(Boolean).join(' ')

  const progressText = isError ? 'blocked' : `${item.progress}%`

  const statusLabel = (() => {
    if (item.status === 'done')      return '✓ uploaded'
    if (isError)                     return '✕ rejected'
    if (item.status === 'uploading') return 'uploading…'
    return item.status
  })()

  return (
    <div className={styles.row}>
      <div className={ftypeClass}>{isError ? '!!' : ext}</div>
      <div className={styles.fname}>{item.file.name || '(unknown)'}</div>
      <div className={styles.fsize}>{formatSize(item.file.size)}</div>
      <div className={styles.prog}>
        <div
          className={pfillClass}
          style={{ width: `${isError ? 100 : item.progress}%` }}
        />
        <div className={styles.ptext}>{progressText}</div>
      </div>
      <div className={pstateClass}>{statusLabel}</div>
      <button className={styles.xBtn} onClick={() => removeItem(item.id)}>×</button>
      {isError && item.error && (
        <div className={styles.errMsg}>{item.error}</div>
      )}
    </div>
  )
})
