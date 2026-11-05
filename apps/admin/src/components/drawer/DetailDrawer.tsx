import { useSearchParams } from 'react-router-dom'
import { useDrawerAsset } from '../../hooks/useDrawerAsset'
import { useUiStore } from '../../store/uiStore'
import { useAssetsStore } from '../../store/assetsStore'
import { DrawerFormProvider } from '../../context/DrawerFormContext'
import type { MediaAsset, MediaAssetDetail, MediaUsage } from '../../types/media'
import AssetPreview from './AssetPreview'
import AssetFields from './AssetFields'
import AssetMetadata from './AssetMetadata'
import ImageTransformPanel from './ImageTransformPanel'
import UsedInList from './UsedInList'
import DangerZone from './DangerZone'
import styles from './DetailDrawer.module.css'

const EMPTY_USAGE: MediaUsage = { asset_id: '', usage_count: 0, references: [] }

export default function DetailDrawer() {
  const [, setSearchParams] = useSearchParams()
  const { detail, usage, loading, closeDrawer } = useDrawerAsset()
  const drawerAssetId = useUiStore((s) => s.drawerAssetId)
  const storeAssets   = useAssetsStore((s) => s.assets)

  // Fallback to store data when API is unavailable (dev mode)
  const storeAsset = storeAssets.find((a) => a.id === drawerAssetId) ?? null
  const asset: MediaAsset | null = (detail as MediaAssetDetail | null) ?? storeAsset
  const usageData: MediaUsage = usage ?? (asset ? { ...EMPTY_USAGE, asset_id: asset.id } : EMPTY_USAGE)

  if (!asset) return null

  const isImage = asset.resource_type === 'image'

  function handleClose() {
    closeDrawer()
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('asset')
      return next
    })
  }

  return (
    <div className={`${styles.drawer} wobble`}>
      <div className={styles.drawerHead}>
        <h3>Asset detail</h3>
        <button className={styles.close} onClick={handleClose} aria-label="Close drawer">
          ×
        </button>
      </div>

      <div className={styles.drawerBody}>
        {loading ? (
          <div className={styles.loadingState}>Loading…</div>
        ) : (
          <DrawerFormProvider asset={asset}>
            <AssetPreview asset={asset} />
            <AssetFields asset={asset} />
            <AssetMetadata asset={asset} />
            {isImage && <ImageTransformPanel asset={asset} />}
            <UsedInList references={usageData.references} />
            <DangerZone assetId={asset.id} usageCount={usageData.references.length} />
          </DrawerFormProvider>
        )}
      </div>
    </div>
  )
}
