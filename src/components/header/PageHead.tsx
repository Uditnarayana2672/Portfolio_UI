import { useUiStore } from '../../store/uiStore'
import styles from './PageHead.module.css'

export default function PageHead() {
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen)

  return (
    <header className={styles.pagehead}>
      <button
        className={styles.menuBtn}
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open menu"
      >
        <span className={styles.burger} />
      </button>

      <div className={styles.titleWrap}>
        <h1>
          Media Manager <span className={styles.scribble}>/ Library</span>
        </h1>
        <nav className={styles.crumbs}>
          <a href="/dashboard">Dashboard</a>
          {' › '}
          <a href="#">Admin</a>
          {' › '}
          Media
        </nav>
      </div>

      <div className={styles.meta}>
        Spec § 5.4 · § 8.4<br />
        Cloudinary · 84 assets · 1.4 GB
      </div>
    </header>
  )
}
