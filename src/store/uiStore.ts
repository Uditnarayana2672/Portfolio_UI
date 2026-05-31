import { create } from 'zustand'
import type { ViewMode } from '../types/media'

interface UiState {
  viewMode: ViewMode
  drawerAssetId: string | null
  deleteConfirmIds: string[]
  selectedAssets: string[]

  // Theme knobs — written to CSS vars in MediaManagerPage
  accentColor: string
  paperColor: string
  wobbleEnabled: boolean

  setViewMode: (mode: ViewMode) => void
  openDrawer: (assetId: string) => void
  closeDrawer: () => void
  openDeleteConfirm: (ids: string[]) => void
  closeDeleteConfirm: () => void
  toggleSelect: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
  setAccentColor: (c: string) => void
  setPaperColor: (c: string) => void
  setWobbleEnabled: (v: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  viewMode: 'grid',
  drawerAssetId: null,
  deleteConfirmIds: [],
  selectedAssets: [],

  accentColor: '#c1432a',
  paperColor: '#f5f1e8',
  wobbleEnabled: false,

  setViewMode: (viewMode) => set({ viewMode }),

  openDrawer: (assetId) => set({ drawerAssetId: assetId }),

  closeDrawer: () => set({ drawerAssetId: null }),

  openDeleteConfirm: (ids) => set({ deleteConfirmIds: ids }),

  closeDeleteConfirm: () => set({ deleteConfirmIds: [] }),

  toggleSelect: (id) =>
    set((s) => ({
      selectedAssets: s.selectedAssets.includes(id)
        ? s.selectedAssets.filter((x) => x !== id)
        : [...s.selectedAssets, id],
    })),

  selectAll: (ids) => set({ selectedAssets: ids }),

  clearSelection: () => set({ selectedAssets: [] }),

  setAccentColor: (accentColor) => set({ accentColor }),
  setPaperColor:  (paperColor)  => set({ paperColor }),
  setWobbleEnabled: (wobbleEnabled) => set({ wobbleEnabled }),
}))
