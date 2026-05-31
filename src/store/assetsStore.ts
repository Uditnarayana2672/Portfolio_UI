import { create } from 'zustand'
import type { MediaAsset, MediaStats } from '../types/media'

const now = Date.now()
const MOCK_ASSETS: MediaAsset[] = [
  {
    id: '1',
    resource_type: 'image', format: 'jpg',
    width: 1600, height: 900, file_size: 1258291,
    file_name: 'hero-shot.jpg',
    public_id: 'projects/thumbnails/lighthouse-hero',
    cloudinary_url: 'https://picsum.photos/seed/hero/1600/900',
    folder: 'projects/thumbnails',
    alt_text: null, source_type: 'cloudinary', thumbnail_url: null,
    video_duration_seconds: null, is_orphan: false, cdn_status: 'active',
    uploaded_by: null, uploaded_by_name: null,
    created_at: new Date(now - 2 * 3600_000).toISOString(),
    updated_at: new Date(now - 2 * 3600_000).toISOString(),
  },
  {
    id: '2',
    resource_type: 'video', format: 'mp4',
    width: 1920, height: 1080, file_size: 44040192,
    file_name: 'jerry-conversation-demo.mp4',
    public_id: 'projects/diagrams/jerry-demo',
    cloudinary_url: null,
    folder: 'projects/diagrams',
    alt_text: null, source_type: 'cloudinary', thumbnail_url: null,
    video_duration_seconds: 30, is_orphan: false, cdn_status: 'active',
    uploaded_by: null, uploaded_by_name: null,
    created_at: new Date(now - 24 * 3600_000).toISOString(),
    updated_at: new Date(now - 24 * 3600_000).toISOString(),
  },
  {
    id: '3',
    resource_type: 'raw', format: 'pdf',
    width: 12, height: null, file_size: 188416,
    file_name: 'udit-resume-2026.pdf',
    public_id: 'uncategorized/resume-2026',
    cloudinary_url: null,
    folder: 'uncategorized',
    alt_text: null, source_type: 'cloudinary', thumbnail_url: null,
    video_duration_seconds: null, is_orphan: false, cdn_status: 'active',
    uploaded_by: null, uploaded_by_name: null,
    created_at: new Date(now - 3 * 86400_000).toISOString(),
    updated_at: new Date(now - 3 * 86400_000).toISOString(),
  },
  {
    id: '4',
    resource_type: 'image', format: 'png',
    width: 1200, height: 630, file_size: 253952,
    file_name: 'og-portfolio-2026.png',
    public_id: 'system/og-images/og-portfolio-2026',
    cloudinary_url: null,
    folder: 'system/og-images',
    alt_text: null, source_type: 'cloudinary', thumbnail_url: null,
    video_duration_seconds: null, is_orphan: true, cdn_status: 'orphan',
    uploaded_by: null, uploaded_by_name: null,
    created_at: new Date(now - 5 * 86400_000).toISOString(),
    updated_at: new Date(now - 5 * 86400_000).toISOString(),
  },
]

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
  assets: MOCK_ASSETS,
  total: MOCK_ASSETS.length,
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
