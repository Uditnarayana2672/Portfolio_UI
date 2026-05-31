import { useFiltersStore } from '../../store/filtersStore'
import styles from './FolderPills.module.css'

const FOLDER_MOCKS = [
  { name: 'blog/covers',           color: '#2a5fa3',              count: 24 },
  { name: 'blog/inline',           color: 'rgba(42,95,163,0.55)', count: 18 },
  { name: 'projects/thumbnails',   color: '#c1432a',              count: 15 },
  { name: 'projects/diagrams',     color: 'rgba(193,67,42,0.55)', count: 9  },
  { name: 'system/og-images',      color: '#7a3aa6',              count: 12 },
  { name: 'system/avatars',        color: '#6aa84f',              count: 6  },
]

const TYPE_MOCKS = [
  { name: 'image', count: 71 },
  { name: 'video', count: 9  },
  { name: 'raw',   count: 4  },
]

export default function FolderPills() {
  const folder        = useFiltersStore((s) => s.folder)
  const resourceType  = useFiltersStore((s) => s.resource_type)
  const setFolder     = useFiltersStore((s) => s.setFolder)
  const setType       = useFiltersStore((s) => s.setResourceType)

  return (
    <div className={`${styles.pills} wobble`}>
      <span className={styles.pillLabel}>Folder</span>

      <button
        className={`${styles.pill} ${folder === null ? styles.active : ''}`}
        onClick={() => setFolder(null)}
      >
        All <span className={styles.count}>84</span>
      </button>

      {FOLDER_MOCKS.map((f) => (
        <button
          key={f.name}
          className={`${styles.pill} ${folder === f.name ? styles.active : ''}`}
          onClick={() => setFolder(f.name)}
        >
          <span className={styles.folderMark} style={{ background: f.color }} />
          {f.name.split('/')[1]}
          <span className={styles.count}>{f.count}</span>
        </button>
      ))}

      <span className={styles.pillDivider} aria-hidden="true" />

      <span className={styles.pillLabel}>Type</span>

      <button
        className={`${styles.pill} ${resourceType === null ? styles.active : ''}`}
        onClick={() => setType(null)}
      >
        All <span className={styles.count}>84</span>
      </button>

      {TYPE_MOCKS.map((t) => (
        <button
          key={t.name}
          className={`${styles.pill} ${resourceType === t.name ? styles.active : ''}`}
          onClick={() => setType(t.name)}
        >
          {t.name} <span className={styles.count}>{t.count}</span>
        </button>
      ))}
    </div>
  )
}
