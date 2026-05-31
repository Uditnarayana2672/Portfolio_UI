import { useCallback, useEffect } from 'react'
import { listMedia, getMediaStats } from '../api/mediaApi'
import { useAssetsStore } from '../store/assetsStore'
import { useFiltersStore } from '../store/filtersStore'

export function useAssets() {
  const { setAssets, setStats, setLoading, setError } = useAssetsStore()
  const filters = useFiltersStore()

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [listRes, statsRes] = await Promise.all([
        listMedia(filters),
        getMediaStats(),
      ])
      setAssets(listRes.assets, listRes.total, listRes.folder_stats, listRes.type_stats)
      setStats(statsRes)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load media'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [
    filters.folder,
    filters.resource_type,
    filters.search,
    filters.page,
    filters.limit,
    filters.sort_by,
    filters.order,
  ])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { refetch: fetch }
}
