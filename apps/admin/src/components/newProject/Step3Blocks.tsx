import { useState, useRef } from 'react'
import { useWizardStore } from '../../store/wizardStore'
import type { WizardBlock } from '../../store/wizardStore'
import { BLOCK_TYPES, TYPE_BY_ID, defaultEditorData, previewText } from '../project/blocks/blockTypes'
import type { BlockId } from '../project/blocks/blockTypes'
import BlockEditorDrawer from './BlockEditorDrawer'
import type { DrawerState } from './BlockEditorDrawer'
import styles from './Step3Blocks.module.css'

export default function Step3Blocks() {
  const blocks         = useWizardStore((s) => s.blocks)
  const selectedTemplate = useWizardStore((s) => s.selectedTemplate)
  const addBlock       = useWizardStore((s) => s.addBlock)
  const deleteBlock    = useWizardStore((s) => s.deleteBlock)
  const reorderBlocks  = useWizardStore((s) => s.reorderBlocks)
  const updateBlock    = useWizardStore((s) => s.updateBlock)

  const [pickerOpen, setPickerOpen]   = useState(false)
  const [drawerState, setDrawerState] = useState<DrawerState | null>(null)
  const [draggingIdx, setDraggingIdx] = useState(-1)
  const [dragOverIdx, setDragOverIdx] = useState(-1)
  const dragSrcIdx = useRef(-1)

  function openAddDrawer(typeId: BlockId) {
    setPickerOpen(false)
    setDrawerState({ mode: 'add', typeId, blockId: null, data: defaultEditorData(typeId) })
  }

  function openEditDrawer(block: WizardBlock) {
    setDrawerState({
      mode: 'edit',
      typeId: block.typeId,
      blockId: block.id,
      data: block.data,
    })
  }

  function handleDrawerSave(
    typeId: BlockId,
    blockId: string | null,
    data: Record<string, unknown>
  ) {
    const preview = previewText(typeId, data)
    if (blockId) {
      updateBlock(blockId, { data, preview })
    } else {
      addBlock(typeId, data, preview)
    }
    setDrawerState(null)
  }

  function handleDragStart(idx: number) {
    dragSrcIdx.current = idx
    setDraggingIdx(idx)
  }

  function handleDragEnd() {
    setDraggingIdx(-1)
    setDragOverIdx(-1)
    dragSrcIdx.current = -1
  }

  function handleDrop(idx: number) {
    const src = dragSrcIdx.current
    if (src === -1 || src === idx) return
    const next = [...blocks]
    const [moved] = next.splice(src, 1)
    next.splice(idx, 0, moved)
    reorderBlocks(next)
  }

  return (
    <div>
      <p className={styles.intro}>
        <b>Compose the page.</b>{' '}
        Drag rows to reorder. Click{' '}
        <span className={styles.ic}>✎</span> to edit a block,{' '}
        <span className={styles.ic}>✨</span> for AI assist, or{' '}
        <span className={styles.ic}>+ add block</span> below to insert new ones.
      </p>

      {/* Header count */}
      <div className={styles.blocksHead}>
        <span className={styles.blocksTitle}>Content blocks</span>
        <span className={styles.count}>
          {blocks.length} BLOCK{blocks.length !== 1 ? 'S' : ''} · TEMPLATE:{' '}
          {selectedTemplate.toUpperCase()}
        </span>
      </div>

      {/* Block list */}
      <div className={styles.blockList}>
        {blocks.length === 0 && (
          <div className={styles.emptyList}>
            no blocks yet — add one below ↓
          </div>
        )}
        {blocks.map((block, idx) => {
          const type = TYPE_BY_ID[block.typeId]
          const isDragging = draggingIdx === idx
          const isOver = dragOverIdx === idx && draggingIdx !== idx
          return (
            <div
              key={block.id}
              className={[
                styles.blockRow,
                isDragging ? styles.blockRowDragging : '',
                isOver ? styles.blockRowOver : '',
              ].join(' ')}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx) }}
              onDragLeave={() => setDragOverIdx(-1)}
              onDrop={() => { handleDrop(idx); setDragOverIdx(-1) }}
            >
              <span className={styles.dragH} title="Drag to reorder">⋮⋮</span>
              <div className={styles.blockIcon}>{type.icon}</div>
              <div className={styles.blockMeta}>
                <div className={styles.blockType}>{type.label}</div>
                <div className={styles.blockPrev}>{block.preview}</div>
              </div>
              <div className={styles.blockActs}>
                <button
                  className={`${styles.bact} ${styles.bactAi}`}
                  title="AI assist · coming in Step 4"
                  aria-label="AI assist"
                  tabIndex={0}
                >
                  ✨
                </button>
                <button
                  className={styles.bact}
                  title="Edit block"
                  aria-label="Edit block"
                  onClick={() => openEditDrawer(block)}
                >
                  ✎
                </button>
                <button
                  className={`${styles.bact} ${styles.bactDanger}`}
                  title="Delete block"
                  aria-label="Delete block"
                  onClick={() => deleteBlock(block.id)}
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add block button */}
      <button
        className={`${styles.addBlockBtn} ${pickerOpen ? styles.addBlockBtnOpen : ''}`}
        onClick={() => setPickerOpen((o) => !o)}
        aria-expanded={pickerOpen}
      >
        {pickerOpen ? '▲ close picker' : '+ add block'}
      </button>

      {/* Picker grid */}
      {pickerOpen && (
        <div className={styles.picker}>
          {BLOCK_TYPES.map((type) => (
            <div
              key={type.id}
              className={styles.pickerOpt}
              role="button"
              tabIndex={0}
              onClick={() => openAddDrawer(type.id)}
              onKeyDown={(e) => e.key === 'Enter' && openAddDrawer(type.id)}
            >
              <span className={styles.pi}>{type.icon}</span>
              <span className={styles.pl}>{type.pickerLabel}</span>
            </div>
          ))}
        </div>
      )}

      {/* Slide-up drawer */}
      <BlockEditorDrawer
        state={drawerState}
        onClose={() => setDrawerState(null)}
        onSave={handleDrawerSave}
      />
    </div>
  )
}
