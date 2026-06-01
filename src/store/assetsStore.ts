import { create } from 'zustand'
import type { MediaAsset, MediaStats } from '../types/media'

interface AssetsState {
  assets: MediaAsset[]
  total: number
  folderStats: Record<string, number>
  typeStats: Record<string, number>
  stats: MediaStats | null
  loading: boolean
  error: string | null

  setAssets: (assets: MediaAsset[], total: number, folderStats: Record<string, number>, typeStats: Record<string, number>) => void
  setStats: (stats: MediaStats) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  removeAsset: (id: string) => void
  updateAsset: (asset: MediaAsset) => void
}

export const useAssetsStore = create<AssetsState>((set) => ({
  assets: [],
  total: 0, // populated from GET /admin/media — assets array holds the current page only
  folderStats: {},
  typeStats: {},
  stats: null,
  loading: false,
  error: null,

  setAssets: (assets, total, folderStats, typeStats) =>
    set({ assets, total, folderStats, typeStats }),

  setStats: (stats) => set({ stats }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  removeAsset: (id) =>
    set((s) => ({ assets: s.assets.filter((a) => a.id !== id), total: s.total - 1 })),

  updateAsset: (updated) =>
    set((s) => ({
      assets: s.assets.map((a) => (a.id === updated.id ? updated : a)),
    })),
}))
