import { create } from 'zustand'
import type { UploadItem, UploadStatus, UploadedAsset } from '../types/media'

interface UploadsState {
  queue: UploadItem[]
  targetFolder: string
  addItem: (item: UploadItem) => void
  updateProgress: (id: string, progress: number) => void
  setStatus: (id: string, status: UploadStatus, error?: string) => void
  setResult: (id: string, result: UploadedAsset) => void
  removeItem: (id: string) => void
  clearDone: () => void
  setTargetFolder: (folder: string) => void
}

export const useUploadsStore = create<UploadsState>((set) => ({
  queue: [],
  targetFolder: 'blog/inline',

  addItem: (item) =>
    set((s) => ({ queue: [...s.queue, item] })),

  updateProgress: (id, progress) =>
    set((s) => ({
      queue: s.queue.map((item) => (item.id === id ? { ...item, progress } : item)),
    })),

  setStatus: (id, status, error) =>
    set((s) => ({
      queue: s.queue.map((item) =>
        item.id === id ? { ...item, status, error: error !== undefined ? error : item.error } : item
      ),
    })),

  setResult: (id, result) =>
    set((s) => ({
      queue: s.queue.map((item) =>
        item.id === id ? { ...item, result, status: 'done' as UploadStatus } : item
      ),
    })),

  removeItem: (id) =>
    set((s) => ({ queue: s.queue.filter((item) => item.id !== id) })),

  clearDone: () =>
    set((s) => ({ queue: s.queue.filter((item) => item.status !== 'done') })),

  setTargetFolder: (folder) => set({ targetFolder: folder }),
}))
