import { create } from 'zustand'
import type { MediaFilters } from '../types/media'

interface FiltersState extends MediaFilters {
  setFolder: (folder: string | null) => void
  setResourceType: (type: string | null) => void
  setSearch: (search: string) => void
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setSortBy: (sort_by: MediaFilters['sort_by']) => void
  setOrder: (order: MediaFilters['order']) => void
  reset: () => void
}

const defaults: MediaFilters = {
  folder: null,
  resource_type: null,
  search: '',
  page: 1,
  limit: 24,
  sort_by: 'created_at',
  order: 'desc',
}

export const useFiltersStore = create<FiltersState>((set) => ({
  ...defaults,
  setFolder:       (folder)        => set({ folder, page: 1 }),
  setResourceType: (resource_type) => set({ resource_type, page: 1 }),
  setSearch:       (search)        => set({ search, page: 1 }),
  setPage:         (page)          => set({ page }),
  setLimit:        (limit)         => set({ limit, page: 1 }),
  setSortBy:       (sort_by)       => set({ sort_by }),
  setOrder:        (order)         => set({ order }),
  reset:           ()              => set(defaults),
}))
