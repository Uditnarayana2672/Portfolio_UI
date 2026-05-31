import { useCallback } from 'react'
import { uploadMedia, importUrl } from '../api/mediaApi'
import { useUploadsStore } from '../store/uploadsStore'
import { useAssetsStore } from '../store/assetsStore'
import type { UploadItem } from '../types/media'

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useUpload() {
  const { addItem, updateProgress, setStatus, setResult } = useUploadsStore()
  const { assets, total, folderStats, typeStats, setAssets } = useAssetsStore()

  const uploadFile = useCallback(
    async (file: File, folder: string) => {
      const id = makeId()
      const item: UploadItem = {
        id,
        file,
        folder,
        status: 'pending',
        progress: 0,
        error: null,
        result: null,
      }
      addItem(item)
      setStatus(id, 'uploading')

      try {
        const res = await uploadMedia(file, folder, {}, (pct) => updateProgress(id, pct))
        setResult(id, res.asset)
        if (!res.duplicate) {
          setAssets(
            [res.asset as Parameters<typeof setAssets>[0][0], ...assets],
            total + 1,
            folderStats,
            typeStats
          )
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Upload failed'
        setStatus(id, 'error', msg)
      }
    },
    [assets, total, folderStats, typeStats]
  )

  const importFromUrl = useCallback(
    async (url: string, folder: string, alt_text?: string) => {
      const id = makeId()
      const item: UploadItem = {
        id,
        file: new File([], url),
        folder,
        status: 'pending',
        progress: 0,
        error: null,
        result: null,
      }
      addItem(item)
      setStatus(id, 'uploading')

      try {
        const res = await importUrl(url, folder, alt_text)
        setResult(id, res.asset)
        if (!res.duplicate) {
          setAssets(
            [res.asset as Parameters<typeof setAssets>[0][0], ...assets],
            total + 1,
            folderStats,
            typeStats
          )
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Import failed'
        setStatus(id, 'error', msg)
      }
    },
    [assets, total, folderStats, typeStats]
  )

  return { uploadFile, importFromUrl }
}
