import { createContext, useContext, useState, useEffect } from 'react'
import type { MediaAsset } from '../types/media'
import { updateMedia } from '../api/mediaApi'
import { useAssetsStore } from '../store/assetsStore'

interface DrawerFormContextValue {
  altText: string
  setAltText: (v: string) => void
  folder: string
  setFolder: (v: string) => void
  isDirty: boolean
  isSaving: boolean
  save: () => Promise<void>
}

const DrawerFormContext = createContext<DrawerFormContextValue | null>(null)

export function useDrawerForm() {
  const ctx = useContext(DrawerFormContext)
  if (!ctx) throw new Error('useDrawerForm must be used within DrawerFormProvider')
  return ctx
}

interface ProviderProps {
  asset: MediaAsset
  children: React.ReactNode
}

export function DrawerFormProvider({ asset, children }: ProviderProps) {
  const [altText, setAltText] = useState(asset.alt_text ?? '')
  const [folder, setFolder] = useState(asset.folder ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const updateAsset = useAssetsStore((s) => s.updateAsset)

  useEffect(() => {
    setAltText(asset.alt_text ?? '')
    setFolder(asset.folder ?? '')
  }, [asset.id])

  const isDirty =
    altText !== (asset.alt_text ?? '') || folder !== (asset.folder ?? '')

  async function save() {
    setIsSaving(true)
    try {
      const res = await updateMedia(asset.id, { alt_text: altText, folder })
      updateAsset(res.asset)
    } catch {
      // Dev: no backend — apply optimistically to local store
      updateAsset({ ...asset, alt_text: altText, folder, updated_at: new Date().toISOString() })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DrawerFormContext.Provider
      value={{ altText, setAltText, folder, setFolder, isDirty, isSaving, save }}
    >
      {children}
    </DrawerFormContext.Provider>
  )
}

export default DrawerFormContext
