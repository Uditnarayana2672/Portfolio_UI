import styles from './UploadQueue.module.css'
import { useUploadsStore } from '../../store/uploadsStore'
import { useUpload } from '../../hooks/useUpload'
import UploadRow from './UploadRow'

export default function UploadQueue() {
  const queue        = useUploadsStore((s) => s.queue)
  const targetFolder = useUploadsStore((s) => s.targetFolder)
  const clearDone    = useUploadsStore((s) => s.clearDone)
  const { uploadFile } = useUpload()

  if (queue.length === 0) return null

  const doneCount     = queue.filter((i) => i.status === 'done').length
  const uploadingCount = queue.filter((i) => i.status === 'uploading').length
  const failedItems   = queue.filter((i) => i.status === 'error' || i.status === 'failed')
  const failedCount   = failedItems.length
  const total         = queue.length

  const handleRetryFailed = () => {
    failedItems.forEach((item) => uploadFile(item.file, item.folder))
  }

  return (
    <div className={`${styles.queue} wobble`}>
      <span className={styles.cornerTag}>
        Active uploads · {doneCount} / {total}
      </span>

      <h3 className={styles.heading}>
        Uploading to <span className={styles.folder}>{targetFolder}</span>
      </h3>

      {queue.map((item) => (
        <UploadRow key={item.id} item={item} />
      ))}

      <div className={styles.summary}>
        {doneCount > 0     && <span className={styles.ok}>✓ {doneCount} done</span>}
        {uploadingCount > 0 && <span>↻ {uploadingCount} uploading</span>}
        {failedCount > 0   && <span className={styles.err}>✕ {failedCount} failed</span>}

        <div className={styles.summaryRight}>
          {failedCount > 0 && (
            <button className={styles.btn} onClick={handleRetryFailed}>
              Retry failed
            </button>
          )}
          {doneCount > 0 && (
            <button className={styles.btn} onClick={clearDone}>
              Clear done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
