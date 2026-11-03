import { useBlogEditorStore } from '../../store/blogEditorStore'
import type { MediaPreview } from '../../store/blogEditorStore'
import { editorBridge } from './editor/editorBridge'

// Cover and social image share one field each, edited from several places
// (the big drop zone and the rail thumbnails), so the actions live here.

export function pickImage(kind: 'cover' | 'og') {
  const st = useBlogEditorStore.getState()
  editorBridge.openMedia({
    kind,
    onPick: ([a]) => {
      if (!a) return
      const preview: MediaPreview = { url: a.url, alt: a.alt, width: a.width }
      st.setPreview(kind, preview)
      st.setField(kind === 'cover' ? 'cover_asset_id' : 'og_asset_id', a.id, 0)
    },
  })
}

export function clearImage(kind: 'cover' | 'og') {
  const st = useBlogEditorStore.getState()
  st.setPreview(kind, null)
  st.setField(kind === 'cover' ? 'cover_asset_id' : 'og_asset_id', null, 0)
}
