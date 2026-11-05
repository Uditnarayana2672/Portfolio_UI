import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useUiStore } from '../store/uiStore'
import { useAssetsStore } from '../store/assetsStore'
import { useAssets } from '../hooks/useAssets'
import TweaksPanel from '../components/dev/TweaksPanel'
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
import Pagination from '../components/ui/Pagination'
import DetailDrawer from '../components/drawer/DetailDrawer'
import DeleteModal from '../components/modals/DeleteModal'
import styles from './MediaManagerPage.module.css'

export default function MediaManagerPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const hasDrawer = searchParams.has('asset')

  // Fetch real media + stats from the backend and keep them in sync with the
  // active filters (folder / type / search / page / sort).
  useAssets()

  const total              = useAssetsStore((s) => s.total)

  const accentColor        = useUiStore((s) => s.accentColor)
  const paperColor         = useUiStore((s) => s.paperColor)
  const wobbleEnabled      = useUiStore((s) => s.wobbleEnabled)
  const viewMode           = useUiStore((s) => s.viewMode)
  const drawerAssetId      = useUiStore((s) => s.drawerAssetId)
  const openDrawer         = useUiStore((s) => s.openDrawer)
  const closeDrawer        = useUiStore((s) => s.closeDrawer)
  const deleteConfirmIds   = useUiStore((s) => s.deleteConfirmIds)
  const deleteConflictCount = useUiStore((s) => s.deleteConflictCount)
  const closeDeleteConfirm = useUiStore((s) => s.closeDeleteConfirm)
  const clearSelection     = useUiStore((s) => s.clearSelection)
  const setMobileNavOpen   = useUiStore((s) => s.setMobileNavOpen)

  // Sync theme knobs → CSS custom properties
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentColor)
    document.documentElement.style.setProperty('--accent-soft', accentColor + '22')
    document.documentElement.style.setProperty('--paper', paperColor)
    document.body.classList.toggle('no-wobble', !wobbleEnabled)
  }, [accentColor, paperColor, wobbleEnabled])

  // Sync ?asset= URL param → drawerAssetId store (handles page load / back navigation)
  useEffect(() => {
    const assetId = searchParams.get('asset')
    if (assetId && assetId !== drawerAssetId) {
      openDrawer(assetId)
    } else if (!assetId && drawerAssetId) {
      closeDrawer()
    }
  }, [searchParams.get('asset')])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault()
        document.querySelector<HTMLInputElement>('input[type="search"]')?.focus()
      }
      if (e.key === 'Escape') {
        closeDrawer()
        // The drawer is rendered off the ?asset= URL param, so closing the
        // store alone leaves it mounted — strip the param too.
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev)
          next.delete('asset')
          return next
        }, { replace: true })
        closeDeleteConfirm()
        clearSelection()
        setMobileNavOpen(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [closeDrawer, closeDeleteConfirm, clearSelection, setSearchParams, setMobileNavOpen])

  return (
    <div className={styles.page}>
      <PageHead />

      <div className={`${styles.layout} ${hasDrawer ? '' : styles.noDrawer}`}>

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <Sidebar />

        {/* ── Main ────────────────────────────────────────────── */}
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

          <div id="media-content">
            {viewMode === 'list' ? <MediaList /> : <MediaGrid />}
            <Pagination total={total} />
          </div>
        </main>

        {/* ── Detail Drawer (bottom sheet on mobile) ───────────── */}
        {hasDrawer && (
          <>
            <div
              className={styles.drawerScrim}
              onClick={() =>
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev)
                  next.delete('asset')
                  return next
                }, { replace: true })
              }
            />
            <DetailDrawer />
          </>
        )}
      </div>

      {/* ── Delete confirmation modal ─────────────────────────── */}
      {deleteConfirmIds.length > 0 && (
        <DeleteModal
          assetIds={deleteConfirmIds}
          usageCount={deleteConflictCount}
          onClose={closeDeleteConfirm}
          onConfirmed={() => {}}
        />
      )}

      {import.meta.env.DEV && <TweaksPanel />}
    </div>
  )
}
