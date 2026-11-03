import { useEffect, useMemo } from 'react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import {
  ENTER_DELAY_MS,
  registerContentGetter,
  useBlogEditorStore,
} from '../../../store/blogEditorStore'
import type { BlockConfig, TipTapDoc } from '../../../types/blog'
import { editorBridge, insertBlock } from './editorBridge'
import { buildExtensions } from './extensions'
import type { SlashItem } from './SlashMenu'
import s from './editor.module.css'

// ── slash items from the server's block registry ────────────────────────────

function slashItemsFrom(blocks: BlockConfig[]): SlashItem[] {
  const items: SlashItem[] = []
  for (const b of blocks) {
    if (!b.enabled) continue
    const run = insertBlock[b.type]
    if (!run) continue // a block the server knows but this editor build doesn't yet
    if (b.variants?.length) {
      for (const v of b.variants) {
        items.push({
          key: `${b.type}:${v.key}`,
          label: b.type === 'callout' ? `Callout · ${v.label}` : v.label,
          icon: b.type === 'heading' ? v.key.toUpperCase().replace('H3N', '#.') : v.icon ?? b.icon,
          hint: v.shortcut?.trim(),
          group: b.group,
          keywords: [...b.slash_keywords, v.key, v.label.toLowerCase()],
          run: (e, r) => run(e, r, v.key),
        })
      }
    } else {
      items.push({
        key: b.type, label: b.label, icon: b.icon, group: b.group,
        keywords: [...b.slash_keywords, b.label.toLowerCase()],
        run: (e, r) => run(e, r),
      })
    }
  }
  return items
}

// The slash extension is built once per editor; it reads the current items here.
let currentSlashItems: SlashItem[] = []

function filterItems(all: SlashItem[], query: string): SlashItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return all
  return all.filter((i) => i.label.toLowerCase().includes(q) || i.keywords.some((k) => k.startsWith(q)))
}

// ── toolbar ─────────────────────────────────────────────────────────────────

function Btn({ label, title, active, onClick, mono, disabled }: {
  label: React.ReactNode
  title: string
  active?: boolean
  onClick: () => void
  mono?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      className={`${s.tb}${mono ? ` ${s.tbMono}` : ''}${active ? ` ${s.tbActive}` : ''}`}
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const st = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3, numbered: false }),
      h3n: e.isActive('heading', { level: 3, numbered: true }),
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      link: e.isActive('link'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      code: e.isActive('code'),
      codeBlock: e.isActive('codeBlock'),
      table: e.isActive('table'),
      callout: e.isActive('callout'),
      highlight: e.isActive('highlight'),
      tableAttrs: e.isActive('table') ? e.getAttributes('table') : null,
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  })
  const c = () => editor.chain().focus()
  const heading = (level: 2 | 3, numbered = false) => {
    const isOn = editor.isActive('heading', { level, numbered })
    if (isOn) c().setParagraph().run()
    else c().setNode('heading', { level, numbered }).run()
  }

  return (
    <div className={s.toolbar} role="toolbar" aria-label="Formatting">
      <div className={s.tbGroup}>
        <Btn mono label="H2" title="Section heading (## )" active={st.h2} onClick={() => heading(2)} />
        <Btn mono label="H3" title="Sub-heading (### )" active={st.h3} onClick={() => heading(3)} />
        <Btn mono label="#." title="Numbered sub-heading (#. ) — numbers itself" active={st.h3n} onClick={() => heading(3, true)} />
      </div>
      <div className={s.tbSep} />
      <div className={s.tbGroup}>
        <Btn mono label={<b>B</b>} title="Bold (Ctrl/⌘+B)" active={st.bold} onClick={() => c().toggleBold().run()} />
        <Btn mono label={<i>I</i>} title="Italic (Ctrl/⌘+I)" active={st.italic} onClick={() => c().toggleItalic().run()} />
        <Btn mono label={<u>U</u>} title="Underline (Ctrl/⌘+U)" active={st.underline} onClick={() => c().toggleUnderline().run()} />
        <Btn mono label={<s>S</s>} title="Strikethrough (Ctrl/⌘+Shift+X)" active={st.strike} onClick={() => c().toggleStrike().run()} />
        <Btn label={<span className={s.hlSwatch}>A</span>} title="Highlight (Ctrl/⌘+Shift+H)" active={st.highlight}
          onClick={() => c().toggleHighlight({ color: 'highlight' }).run()} />
      </div>
      <div className={s.tbSep} />
      <div className={s.tbGroup}>
        <Btn label="⇗" title="Link (Ctrl/⌘+K)" active={st.link} onClick={() => editorBridge.openLink(editor)} />
        <Btn label="•≡" title="Bulleted list (- )" active={st.bullet} onClick={() => c().toggleBulletList().run()} />
        <Btn label="1." title="Numbered list (1. )" active={st.ordered} onClick={() => c().toggleOrderedList().run()} />
        <Btn label="❝" title="Quote (> )" active={st.quote} onClick={() => c().toggleBlockquote().run()} />
      </div>
      <div className={s.tbSep} />
      <div className={s.tbGroup}>
        <Btn mono label="</>" title="Inline code (Ctrl/⌘+E)" active={st.code} onClick={() => c().toggleCode().run()} />
        <Btn mono label="{ }" title="Code block (```)" active={st.codeBlock} onClick={() => insertBlock.codeBlock(editor)} />
        <Btn label="▦" title="Table" active={st.table} onClick={() => insertBlock.table(editor)} />
        <Btn label="⚑" title="Callout box" active={st.callout} onClick={() => insertBlock.callout(editor)} />
        <Btn label="—" title="Divider (---)" onClick={() => insertBlock.horizontalRule(editor)} />
      </div>
      <div className={s.tbSep} />
      <div className={s.tbGroup}>
        <Btn label="🖼" title="Image" onClick={() => insertBlock.image(editor)} />
        <Btn label="▤" title="Scrollable image gallery" onClick={() => insertBlock.imageGallery(editor)} />
        <Btn label="▶" title="Video (upload or YouTube)" onClick={() => insertBlock.video(editor)} />
        <Btn label="⎘" title="Embed (CodePen, Figma, Gist…)" onClick={() => insertBlock.embed(editor)} />
      </div>
      <div className={s.tbSpacer} />
      <div className={s.tbGroup}>
        <Btn label="↶" title="Undo (Ctrl/⌘+Z)" disabled={!st.canUndo} onClick={() => c().undo().run()} />
        <Btn label="↷" title="Redo (Ctrl/⌘+Shift+Z)" disabled={!st.canRedo} onClick={() => c().redo().run()} />
      </div>
      {st.table && st.tableAttrs && <TableBar editor={editor} attrs={st.tableAttrs} />}
    </div>
  )
}

function TableBar({ editor, attrs }: { editor: Editor; attrs: Record<string, unknown> }) {
  const palette = useBlogEditorStore((x) => x.config?.palette) ?? []
  const c = () => editor.chain().focus()
  return (
    <div className={s.tableBar} role="toolbar" aria-label="Table">
      <span className={s.tableBarTag}>table</span>
      <button type="button" className={s.tblBtn} onClick={() => c().addRowBefore().run()}>+ row above</button>
      <button type="button" className={s.tblBtn} onClick={() => c().addRowAfter().run()}>+ row below</button>
      <button type="button" className={s.tblBtn} onClick={() => c().deleteRow().run()}>− row</button>
      <span className={s.tbSep} />
      <button type="button" className={s.tblBtn} onClick={() => c().addColumnBefore().run()}>+ col left</button>
      <button type="button" className={s.tblBtn} onClick={() => c().addColumnAfter().run()}>+ col right</button>
      <button type="button" className={s.tblBtn} onClick={() => c().deleteColumn().run()}>− col</button>
      <span className={s.tbSep} />
      <button type="button" className={s.tblBtn} onClick={() => c().mergeOrSplit().run()}>merge/split</button>
      <button type="button" className={s.tblBtn} onClick={() => c().toggleHeaderRow().run()}>header row</button>
      <button type="button" className={s.tblBtn} onClick={() => c().toggleHeaderColumn().run()}>header col</button>
      <span className={s.tbSep} />
      <label className={s.tblLabel}>
        header
        <select
          className={s.miniSelect}
          value={String(attrs.header_style ?? 'ink')}
          onChange={(e) => c().updateAttributes('table', { header_style: e.target.value }).run()}
        >
          {palette.map((p) => <option key={p.token} value={p.token}>{p.label}</option>)}
        </select>
      </label>
      <label className={s.tblLabel}>
        <input
          type="checkbox"
          checked={!!attrs.striped}
          onChange={(e) => c().updateAttributes('table', { striped: e.target.checked }).run()}
        />
        stripes
      </label>
      <label className={s.tblLabel}>
        borders
        <select
          className={s.miniSelect}
          value={String(attrs.border ?? 'grid')}
          onChange={(e) => c().updateAttributes('table', { border: e.target.value }).run()}
        >
          <option value="grid">grid</option>
          <option value="rows">rows</option>
          <option value="none">none</option>
        </select>
      </label>
      <span className={s.tbSep} />
      <span className={s.tblLabel}>cell</span>
      <button type="button" className={s.swatch} title="No fill" onClick={() => c().setCellAttribute('background', null).run()}>∅</button>
      {palette.map((p) => (
        <button
          key={p.token}
          type="button"
          className={s.swatch}
          style={{ background: p.bg, color: p.fg }}
          title={`Fill: ${p.label}`}
          onClick={() => c().setCellAttribute('background', p.token).run()}
        />
      ))}
      <select
        className={s.miniSelect}
        defaultValue=""
        aria-label="Cell alignment"
        onChange={(e) => {
          c().setCellAttribute('align', e.target.value || null).run()
          e.target.value = ''
        }}
      >
        <option value="" disabled>align…</option>
        <option value="left">left</option>
        <option value="center">center</option>
        <option value="right">right</option>
      </select>
      <button type="button" className={`${s.tblBtn} ${s.tblDanger}`} onClick={() => c().deleteTable().run()}>delete table</button>
    </div>
  )
}

function BubbleButtons({ editor }: { editor: Editor }) {
  const st = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'), italic: e.isActive('italic'), underline: e.isActive('underline'),
      code: e.isActive('code'), highlight: e.isActive('highlight'), link: e.isActive('link'),
    }),
  })
  const c = () => editor.chain().focus()
  return (
    <>
      <Btn mono label={<b>B</b>} title="Bold" active={st.bold} onClick={() => c().toggleBold().run()} />
      <Btn mono label={<i>I</i>} title="Italic" active={st.italic} onClick={() => c().toggleItalic().run()} />
      <Btn mono label={<u>U</u>} title="Underline" active={st.underline} onClick={() => c().toggleUnderline().run()} />
      <Btn mono label="</>" title="Inline code" active={st.code} onClick={() => c().toggleCode().run()} />
      <Btn label={<span className={s.hlSwatch}>A</span>} title="Highlight" active={st.highlight}
        onClick={() => c().toggleHighlight({ color: 'highlight' }).run()} />
      <Btn label="⇗" title="Link" active={st.link} onClick={() => editorBridge.openLink(editor)} />
    </>
  )
}

// ── editor ──────────────────────────────────────────────────────────────────

interface Props {
  initialContent: TipTapDoc
  onReady?: (editor: Editor) => void
}

export default function BlogEditor({ initialContent, onReady }: Props) {
  const markContentDirty = useBlogEditorStore((x) => x.markContentDirty)
  const flush = useBlogEditorStore((x) => x.flush)
  const blocks = useBlogEditorStore((x) => x.config?.blocks)
  const allItems = useMemo(() => slashItemsFrom(blocks ?? []), [blocks])

  useEffect(() => {
    currentSlashItems = allItems
  }, [allItems])

  const editor = useEditor({
    extensions: buildExtensions((q) => filterItems(currentSlashItems, q)),
    content: initialContent,
    immediatelyRender: true,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: { class: 'bp-editor', spellcheck: 'true' },
      handleKeyDown: (_view, event) => {
        // Save right after a block is finished ("draft saved after each Enter").
        if (event.key === 'Enter' && !event.shiftKey) setTimeout(() => markContentDirty(ENTER_DELAY_MS), 0)
        return false
      },
    },
    onUpdate: () => markContentDirty(),
    onBlur: () => void flush(),
  })

  useEffect(() => {
    registerContentGetter(() => editor.getJSON() as TipTapDoc)
    onReady?.(editor)
    return () => registerContentGetter(null)
  }, [editor, onReady])

  return (
    <div className={s.editorWrap}>
      <Toolbar editor={editor} />
      <BubbleMenu
        editor={editor}
        className={s.bubble}
        shouldShow={({ editor: e, from, to }) => from !== to && !e.isActive('codeBlock') && !e.isActive('image')
          && !e.isActive('imageGallery') && !e.isActive('video') && !e.isActive('embed')}
      >
        <BubbleButtons editor={editor} />
      </BubbleMenu>
      <EditorContent editor={editor} className={`${s.prose} bp-prose`} />
    </div>
  )
}
