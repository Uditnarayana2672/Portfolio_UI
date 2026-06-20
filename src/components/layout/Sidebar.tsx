import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAssetsStore } from '../../store/assetsStore'
import { useFiltersStore } from '../../store/filtersStore'
import { useUiStore } from '../../store/uiStore'
import { folderColor } from '../../lib/folderColors'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  'Overview', 'Projects', 'Blogs', 'Media',
  'Polls & forms', 'Users', 'Jerry', 'Notebook', 'Analytics',
]

const NAV_ROUTES: Record<string, string> = {
  'Overview':     '/dashboard',
  'Projects':     '/admin/projects',
  'Blogs':        '/blog',
  'Media':        '/admin/media',
}

interface Props {
  activeItem?: string
}

export default function Sidebar({ activeItem = 'Media' }: Props) {
  const navigate = useNavigate()

  const folderStats   = useAssetsStore((s) => s.folderStats)
  const stats         = useAssetsStore((s) => s.stats)
  const activeFolder  = useFiltersStore((s) => s.folder)
  const setFolder     = useFiltersStore((s) => s.setFolder)
  const mobileNavOpen   = useUiStore((s) => s.mobileNavOpen)
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen)

  function handleFolderClick(name: string) {
    setFolder(activeFolder === name ? null : name)
    setMobileNavOpen(false)   // dismiss the off-canvas drawer after picking
  }

  const folders = Object.entries(folderStats).sort(([a], [b]) => a.localeCompare(b))
  const storage = stats?.storage

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {/* Backdrop — only visible on mobile while the drawer is open */}
      <div
        className={`${styles.scrim}${mobileNavOpen ? ` ${styles.scrimShow}` : ''}`}
        onClick={() => setMobileNavOpen(false)}
      />
      <aside className={`${styles.nav} wobble${mobileNavOpen ? ` ${styles.open}` : ''}`}>
      <div className={styles.navMain}>

        {/* ── Admin nav ── */}
        <div className={styles.navhead}>Admin</div>
        <ul className={styles.navList}>
          {NAV_ITEMS.map((item) => (
            <li
              key={item}
              className={`${styles.navItem}${item === activeItem ? ` ${styles.active}` : ''}`}
              onClick={() => {
                const route = NAV_ROUTES[item]
                if (route) navigate(route)
              }}
            >
              {item}
            </li>
          ))}
        </ul>

        {/* ── Folders ── */}
        <div className={styles.folderSection}>
          <div className={styles.navhead}>Folders</div>
          <ul className={styles.navList}>
            {folders.length === 0 && (
              <li className={styles.folderItem}>
                <span className={styles.folderName}>No folders yet</span>
              </li>
            )}
            {folders.map(([name, count]) => (
              <li
                key={name}
                className={`${styles.folderItem}${activeFolder === name ? ` ${styles.active}` : ''}`}
                onClick={() => handleFolderClick(name)}
              >
                <span
                  className={styles.folderDot}
                  style={{ background: folderColor(name) }}
                />
                <span className={styles.folderName}>{name}</span>
                <span className={styles.folderCount}>{count}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Cloudinary ── */}
        {storage && (
          <div className={styles.cloudSection}>
            <div className={styles.navhead}>Cloudinary</div>
            <div className={styles.cloudRow}>
              <span
                className={`${styles.dot} ${storage.percent_used >= 75 ? styles.dotWarn : ''}`}
              />
              <span className={styles.cloudUsed}>{storage.percent_used}% used</span>
            </div>
            <div className={styles.cloudPlan}>
              {storage.used_human} / {storage.quota_human} · plan: {storage.plan}
            </div>
          </div>
        )}

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
    </>
  )
}
