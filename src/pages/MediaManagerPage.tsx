import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useUiStore } from '../store/uiStore'
import PageHead from '../components/header/PageHead'
import styles from './MediaManagerPage.module.css'

export default function MediaManagerPage() {
  const [searchParams] = useSearchParams()
  const hasDrawer = searchParams.has('asset')

  const accentColor   = useUiStore((s) => s.accentColor)
  const paperColor    = useUiStore((s) => s.paperColor)
  const wobbleEnabled = useUiStore((s) => s.wobbleEnabled)

  // Sync theme knobs → CSS custom properties
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentColor)
    document.documentElement.style.setProperty('--accent-soft', accentColor + '22')
    document.documentElement.style.setProperty('--paper', paperColor)
    document.body.classList.toggle('no-wobble', !wobbleEnabled)
  }, [accentColor, paperColor, wobbleEnabled])

  return (
    <div className={styles.page}>
      <PageHead />

      <div className={`${styles.layout} ${hasDrawer ? '' : styles.noDrawer}`}>

        {/* ── Sidebar ─────────────────────────── */}
        <aside className={`${styles.zone} ${styles.sidebar}`}>
          <span className={styles.zoneLabel}>component</span>
          <span className={styles.zoneName}>Sidebar</span>
          <span className={styles.zoneLabel}>NavList · FolderList · CloudinaryUsage · UserChip</span>
        </aside>

        {/* ── Main ────────────────────────────── */}
        <main className={`${styles.zone} ${styles.main}`}>
          <span className={styles.zoneLabel}>component</span>
          <span className={styles.zoneName}>Main</span>
          <span className={styles.zoneLabel}>
            StatsStrip · Dropzone · Toolbar · FolderPills · MediaGrid
          </span>
        </main>

        {/* ── Detail Drawer (only when ?asset= is present) ── */}
        {hasDrawer && (
          <aside className={`${styles.zone} ${styles.drawer}`}>
            <span className={styles.zoneLabel}>component</span>
            <span className={styles.zoneName}>DetailDrawer</span>
            <span className={styles.zoneLabel}>
              AssetPreview · AssetFields · ImageTransformPanel
            </span>
          </aside>
        )}
      </div>
    </div>
  )
}
