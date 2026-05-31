import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  'Overview', 'Projects', 'Blogs', 'Media',
  'Polls & forms', 'Users', 'Jerry', 'Notebook', 'Analytics',
]

const FOLDERS = [
  { name: 'blog/covers',         count: 12, color: '#2a5fa3', opacity: 1    },
  { name: 'blog/inline',         count: 34, color: '#2a5fa3', opacity: 0.55 },
  { name: 'projects/thumbnails', count:  8, color: '#c1432a', opacity: 1    },
  { name: 'projects/diagrams',   count: 15, color: '#c1432a', opacity: 0.55 },
  { name: 'system/og-images',    count:  6, color: '#7a3aa6', opacity: 1    },
  { name: 'system/avatars',      count:  2, color: '#6aa84f', opacity: 1    },
  { name: 'uncategorized',       count:  7, color: '#9b9789', opacity: 1    },
]

const ACTIVE_ITEM = 'Media'

export default function Sidebar() {
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <aside className={`${styles.nav} wobble`}>
      <div className={styles.navMain}>

        {/* ── Admin nav ── */}
        <div className={styles.navhead}>Admin</div>
        <ul className={styles.navList}>
          {NAV_ITEMS.map((item) => (
            <li
              key={item}
              className={`${styles.navItem}${item === ACTIVE_ITEM ? ` ${styles.active}` : ''}`}
            >
              {item}
            </li>
          ))}
        </ul>

        {/* ── Folders ── */}
        <div className={styles.folderSection}>
          <div className={styles.navhead}>Folders</div>
          <ul className={styles.navList}>
            {FOLDERS.map((f) => (
              <li key={f.name} className={styles.folderItem}>
                <span
                  className={styles.folderDot}
                  style={{ background: f.color, opacity: f.opacity }}
                />
                <span className={styles.folderName}>{f.name}</span>
                <span className={styles.folderCount}>{f.count}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Cloudinary ── */}
        <div className={styles.cloudSection}>
          <div className={styles.navhead}>Cloudinary</div>
          <div className={styles.cloudRow}>
            <span className={`${styles.dot} ${styles.dotWarn}`} />
            <span className={styles.cloudUsed}>62% used</span>
          </div>
          <div className={styles.cloudPlan}>1.4 / 2.25 GB · plan: PLUS</div>
        </div>

      </div>

      {/* ── Footer ── */}
      <div className={styles.navFoot}>
        <div className={styles.whoChip}>
          <div className={styles.avatar}>U</div>
          <div>
            <div className={styles.whoName}>Udit N.</div>
            <div className={styles.whoRole}>Admin</div>
          </div>
        </div>
        <div className={styles.footItem}>
          <span>⚙</span> Settings
        </div>
        <div className={`${styles.footItem} ${styles.signout}`} onClick={handleSignOut}>
          <span>⏏</span> Sign out
        </div>
      </div>
    </aside>
  )
}
