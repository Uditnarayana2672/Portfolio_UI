import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import styles from './ProjectManagerPage.module.css'

export default function ProjectManagerPage() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <header className={styles.pagehead}>
        <div>
          <h1>Projects <span className={styles.scribble}>/ Manage</span></h1>
          <nav className={styles.crumbs}>
            <a href="/dashboard">Dashboard</a>
            {' › '}
            Projects
          </nav>
        </div>
      </header>

      <div className={styles.layout}>
        <Sidebar activeItem="Projects" />

        <main className={styles.main}>
          <div className={styles.emptyWrap}>
            <p className={styles.emptyHint}>No projects yet — create your first one.</p>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => navigate('/admin/projects/new')}
            >
              <span className={styles.plus}>+</span> New project
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
