import { useUiStore } from '../../store/uiStore'
import styles from './DangerZone.module.css'

interface Props {
  assetId: string
  usageCount: number
}

export default function DangerZone({ assetId, usageCount }: Props) {
  const openDeleteConfirm = useUiStore((s) => s.openDeleteConfirm)

  return (
    <div className={styles.dangerZone}>
      <button
        className={styles.dangerBtn}
        onClick={() => openDeleteConfirm([assetId], usageCount > 0 ? 1 : 0)}
      >
        ✕ Delete from Cloudinary &amp; DB
      </button>

      {usageCount > 0 && (
        <p className={styles.dangerNote}>
          Asset is referenced by {usageCount} place{usageCount !== 1 ? 's' : ''}.
        </p>
      )}
    </div>
  )
}
