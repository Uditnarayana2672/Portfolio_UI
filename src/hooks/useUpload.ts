import { useCallback } from 'react'
import { uploadMedia, importUrl } from '../api/mediaApi'
import { useUploadsStore } from '../store/uploadsStore'
import { useAssetsStore } from '../store/assetsStore'
import type { MediaAsset, UploadItem } from '../types/media'

// Extensions the app accepts — matches the Dropzone <input accept=…> list.
const ALLOWED_EXTS = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'gif',
  'mp4', 'mov', 'webm',
  'pdf',
])

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getExt(name: string): string {
  return (name.split('.').pop() ?? '').toLowerCase()
}

export function useUpload() {
  const { addItem, updateProgress, setStatus, setResult } = useUploadsStore()

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

      // ── Client-side file type validation ────────────────────────
      const ext = getExt(file.name)
      if (!ALLOWED_EXTS.has(ext)) {
        addItem({
          ...item,
          status: 'error',
          progress: 0,
          error: `Unsupported file type (.${ext || '??'}). Allowed: jpg, png, webp, gif, mp4, mov, webm, pdf`,
        })
        return
      }

      addItem(item)
      setStatus(id, 'uploading')

      try {
        const res = await uploadMedia(file, folder, {}, (pct) => updateProgress(id, pct))

        if (res.duplicate) {
          // ── Duplicate detection ─────────────────────────────────
          setResult(id, res.asset)
          setStatus(id, 'duplicate', 'Already in library · use existing?')
        } else {
          setResult(id, res.asset)
          // Use getState() to avoid stale-closure — always reads the
          // current assets array, even when multiple uploads finish
          // close together.
          useAssetsStore.getState().addAsset(res.asset as unknown as MediaAsset)
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Upload failed'
        setStatus(id, 'error', msg)
      }
    },
    []
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

        if (res.duplicate) {
          setResult(id, res.asset)
          setStatus(id, 'duplicate', 'Already in library · use existing?')
        } else {
          setResult(id, res.asset)
          useAssetsStore.getState().addAsset(res.asset as unknown as MediaAsset)
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Import failed'
        setStatus(id, 'error', msg)
      }
    },
    []
  )

  const enqueue = useCallback(
    (files: FileList) => {
      const folder = useUploadsStore.getState().targetFolder
      Array.from(files).forEach((file) => uploadFile(file, folder))
    },
    [uploadFile]
  )

  return { uploadFile, importFromUrl, enqueue }
}
