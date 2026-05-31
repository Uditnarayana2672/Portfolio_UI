import { useState, useEffect } from 'react'
import { getMediaAsset, getMediaUsage, updateMedia } from '../api/mediaApi'
import { useUiStore } from '../store/uiStore'
import { useAssetsStore } from '../store/assetsStore'
import type { MediaAssetDetail, MediaUsage, UpdateMediaRequest } from '../types/media'

export function useDrawerAsset() {
  const drawerAssetId = useUiStore((s) => s.drawerAssetId)
  const closeDrawer = useUiStore((s) => s.closeDrawer)
  const updateAsset = useAssetsStore((s) => s.updateAsset)

  const [detail, setDetail] = useState<MediaAssetDetail | null>(null)
  const [usage, setUsage] = useState<MediaUsage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!drawerAssetId) {
      setDetail(null)
      setUsage(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      getMediaAsset(drawerAssetId),
      getMediaUsage(drawerAssetId),
    ])
      .then(([d, u]) => {
        if (!cancelled) {
          setDetail(d)
          setUsage(u)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load asset')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [drawerAssetId])

  async function save(req: UpdateMediaRequest) {
    if (!drawerAssetId) return
    setSaving(true)
    try {
      const res = await updateMedia(drawerAssetId, req)
      setDetail((prev) => prev ? { ...prev, ...res.asset } : null)
      updateAsset(res.asset)
    } finally {
      setSaving(false)
    }
  }

  return { detail, usage, loading, error, saving, save, closeDrawer }
}
