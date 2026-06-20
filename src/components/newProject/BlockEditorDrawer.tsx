import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { ComponentType } from 'react'
import type { BlockId } from '../project/blocks/blockTypes'
import { TYPE_BY_ID } from '../project/blocks/blockTypes'
import HeroEditor       from '../project/blocks/editors/HeroEditor'
import TextEditor       from '../project/blocks/editors/TextEditor'
import ImageEditor      from '../project/blocks/editors/ImageEditor'
import CodeEditor       from '../project/blocks/editors/CodeEditor'
import CtaEditor        from '../project/blocks/editors/CtaEditor'
import VideoEditor      from '../project/blocks/editors/VideoEditor'
import ComparisonEditor from '../project/blocks/editors/ComparisonEditor'
import PollEditor       from '../project/blocks/editors/PollEditor'
import StatsEditor      from '../project/blocks/editors/StatsEditor'
import QuoteEditor      from '../project/blocks/editors/QuoteEditor'
import GalleryEditor    from '../project/blocks/editors/GalleryEditor'
import TimelineEditor   from '../project/blocks/editors/TimelineEditor'
import FormEditor       from '../project/blocks/editors/FormEditor'
import styles from './BlockEditorDrawer.module.css'

export interface DrawerState {
  mode: 'add' | 'edit'
  typeId: BlockId
  blockId: string | null
  data: Record<string, unknown>
}

interface BlockEditorProps {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}
type EditorComponent = ComponentType<BlockEditorProps>

// Seam: register individual block editors here as they are built
const BLOCK_EDITORS: Partial<Record<BlockId, EditorComponent>> = {
  hero:       HeroEditor,
  text:       TextEditor,
  image:      ImageEditor,
  code:       CodeEditor,
  cta:        CtaEditor,
  video:      VideoEditor,
  comparison: ComparisonEditor,
  poll:       PollEditor,
  stats:      StatsEditor,
  quote:      QuoteEditor,
  gallery:    GalleryEditor,
  timeline:   TimelineEditor,
  form:       FormEditor,
}

interface BlockEditorDrawerProps {
  state: DrawerState | null
  onClose: () => void
  onSave: (typeId: BlockId, blockId: string | null, data: Record<string, unknown>) => void
}

export default function BlockEditorDrawer({ state, onClose, onSave }: BlockEditorDrawerProps) {
  const [localData, setLocalData] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (state) setLocalData({ ...state.data })
  }, [state])

  useEffect(() => {
    if (!state) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state, onClose])

  if (!state) return null

  const typeDef = TYPE_BY_ID[state.typeId]
  const isEdit  = state.mode === 'edit'
  const Editor  = BLOCK_EDITORS[state.typeId]

  // Key forces a fresh mount when opening a different block — critical for TextEditor
  const editorKey = `${state.typeId}-${state.blockId ?? 'new'}`

  return createPortal(
    <>
      <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
      <div
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bd-heading"
      >
        {/* Head */}
        <div className={styles.head}>
          <div className={styles.headIcon}>{typeDef.icon}</div>
          <div className={styles.headInfo}>
            <div className={styles.headName} id="bd-heading">{typeDef.label}</div>
            <div className={styles.headSub}>
              /// {isEdit ? 'editing block' : 'add new block'}
            </div>
          </div>
          <button className={styles.headClose} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {Editor ? (
            <Editor key={editorKey} data={localData} onChange={setLocalData} />
          ) : (
            <div className={styles.bodyEmpty}>
              <div className={styles.emptyGlyph}>{typeDef.icon}</div>
              <div className={styles.emptyTitle}>{typeDef.label} editor</div>
              <div className={styles.emptyBadge}>editor · coming in next step</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.foot}>
          <span className={styles.footHint}>Esc to close</span>
          <div className={styles.footBtns}>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose}>
              Cancel
            </button>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => onSave(state.typeId, state.blockId, localData)}
            >
              {isEdit ? 'Save changes' : '+ Add block'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
