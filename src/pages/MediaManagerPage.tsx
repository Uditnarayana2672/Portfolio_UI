import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useUiStore } from '../store/uiStore'
import PageHead from '../components/header/PageHead'
import Sidebar from '../components/layout/Sidebar'
import StatsStrip from '../components/stats/StatsStrip'
import WarnBanner from '../components/ui/WarnBanner'
import Dropzone from '../components/upload/Dropzone'
import UploadQueue from '../components/upload/UploadQueue'
import Toolbar from '../components/toolbar/Toolbar'
import FolderPills from '../components/toolbar/FolderPills'
import BulkBar from '../components/bulk/BulkBar'
import MediaGrid from '../components/media/MediaGrid'
import MediaList from '../components/media/MediaList'
import styles from './MediaManagerPage.module.css'

export default function MediaManagerPage() {
  const [searchParams] = useSearchParams()
  const hasDrawer = searchParams.has('asset')

  const accentColor   = useUiStore((s) => s.accentColor)
  const paperColor    = useUiStore((s) => s.paperColor)
  const wobbleEnabled = useUiStore((s) => s.wobbleEnabled)
  const viewMode      = useUiStore((s) => s.viewMode)

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
        <Sidebar />

        {/* ── Main ────────────────────────────── */}
        <main className={styles.main}>
          <StatsStrip />
          <WarnBanner />
          <div id="dropzone-anchor">
            <Dropzone />
          </div>
          <UploadQueue />

          <BulkBar />
          <Toolbar />
          <FolderPills />

          {viewMode === 'list' ? <MediaList /> : <MediaGrid />}
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
