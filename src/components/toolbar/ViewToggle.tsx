import { useUiStore } from '../../store/uiStore'
import styles from './ViewToggle.module.css'

export default function ViewToggle() {
  const viewMode = useUiStore((s) => s.viewMode)
  const setViewMode = useUiStore((s) => s.setViewMode)

  return (
    <div className={styles.vtoggle}>
      <button
        className={`${styles.vt} ${viewMode === 'grid' ? styles.active : ''}`}
        onClick={() => setViewMode('grid')}
        aria-label="Grid view"
      >
        <span className={`${styles.vtGlyph} ${styles.grid}`} />
        Grid
      </button>
      <button
        className={`${styles.vt} ${viewMode === 'list' ? styles.active : ''}`}
        onClick={() => setViewMode('list')}
        aria-label="List view"
      >
        <span className={`${styles.vtGlyph} ${styles.list}`} />
        List
      </button>
    </div>
  )
}
