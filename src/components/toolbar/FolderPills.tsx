import { useFiltersStore } from '../../store/filtersStore'
import { useAssetsStore } from '../../store/assetsStore'
import { folderColor, folderLabel } from '../../lib/folderColors'
import styles from './FolderPills.module.css'

// Fixed display order for the resource-type pills; any type the backend reports
// that is not listed here is appended afterward.
const TYPE_ORDER = ['image', 'video', 'raw']

export default function FolderPills() {
  const folder        = useFiltersStore((s) => s.folder)
  const resourceType  = useFiltersStore((s) => s.resource_type)
  const setFolder     = useFiltersStore((s) => s.setFolder)
  const setType       = useFiltersStore((s) => s.setResourceType)

  const total       = useAssetsStore((s) => s.total)
  const folderStats = useAssetsStore((s) => s.folderStats)
  const typeStats   = useAssetsStore((s) => s.typeStats)

  const folders = Object.entries(folderStats).sort(([a], [b]) => a.localeCompare(b))
  const types = Object.keys(typeStats).sort(
    (a, b) => (TYPE_ORDER.indexOf(a) + 1 || 99) - (TYPE_ORDER.indexOf(b) + 1 || 99)
  )

  return (
    <div className={`${styles.pills} wobble`}>
      <span className={styles.pillLabel}>Folder</span>

      <button
        className={`${styles.pill} ${folder === null ? styles.active : ''}`}
        onClick={() => setFolder(null)}
      >
        All <span className={styles.count}>{total}</span>
      </button>

      {folders.map(([name, count]) => (
        <button
          key={name}
          className={`${styles.pill} ${folder === name ? styles.active : ''}`}
          onClick={() => setFolder(name)}
        >
          <span className={styles.folderMark} style={{ background: folderColor(name) }} />
          {folderLabel(name)}
          <span className={styles.count}>{count}</span>
        </button>
      ))}

      <span className={styles.pillDivider} aria-hidden="true" />

      <span className={styles.pillLabel}>Type</span>

      <button
        className={`${styles.pill} ${resourceType === null ? styles.active : ''}`}
        onClick={() => setType(null)}
      >
        All <span className={styles.count}>{total}</span>
      </button>

      {types.map((name) => (
        <button
          key={name}
          className={`${styles.pill} ${resourceType === name ? styles.active : ''}`}
          onClick={() => setType(name)}
        >
          {name} <span className={styles.count}>{typeStats[name]}</span>
        </button>
      ))}
    </div>
  )
}
