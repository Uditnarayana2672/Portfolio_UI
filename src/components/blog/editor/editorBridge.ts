import type { Editor, Range } from '@tiptap/react'

// The editor page owns the modals (media picker, embed, link, table size);
// extensions, slash commands and node views open them through this bridge.

export type MediaKind = 'cover' | 'og' | 'image' | 'gallery' | 'video'

export interface PickedAsset {
  id: string
  url: string
  public_id: string | null
  resource_type: string
  source_type: string
  width: number | null
  height: number | null
  alt: string
  title: string | null
  external_id: string | null
  thumbnail_url: string | null
  duration_seconds: number | null
}

export interface MediaRequest {
  kind: MediaKind
  onPick: (assets: PickedAsset[]) => void
}

export interface EditorBridge {
  openMedia: (req: MediaRequest) => void
  openEmbed: (onDone: (attrs: Record<string, unknown>) => void) => void
  openTable: (onDone: (rows: number, cols: number) => void) => void
  openLink: (editor: Editor) => void
}

export const editorBridge: EditorBridge = {
  openMedia: () => {},
  openEmbed: () => {},
  openTable: () => {},
  openLink: () => {},
}

export function setEditorBridge(bridge: Partial<EditorBridge>) {
  Object.assign(editorBridge, bridge)
}

// ── block insert commands (toolbar + slash menu share these) ────────────────

function at(editor: Editor, range?: Range) {
  const chain = editor.chain().focus()
  return range ? chain.deleteRange(range) : chain
}

/** Insert an atom block (image, video…) and leave the cursor in a paragraph
 *  below it — otherwise the block stays selected and the next key replaces it. */
function insertAtom(editor: Editor, node: Record<string, unknown>) {
  editor.chain().focus().insertContent(node).createParagraphNear().run()
}

export function imageAttrs(a: PickedAsset) {
  return {
    asset_id: a.id, public_id: a.public_id, src: a.url, alt: a.alt || null,
    width: a.width, height: a.height, caption: null, size: 'normal',
  }
}

export const insertBlock: Record<string, (editor: Editor, range?: Range, variant?: string) => void> = {
  paragraph: (e, r) => at(e, r).setParagraph().run(),
  heading: (e, r, v) => {
    const level = v === 'h4' ? 4 : v === 'h2' || !v ? 2 : 3
    at(e, r).setNode('heading', { level, numbered: v === 'h3n' }).run()
  },
  bulletList: (e, r) => at(e, r).toggleBulletList().run(),
  orderedList: (e, r) => at(e, r).toggleOrderedList().run(),
  blockquote: (e, r) => at(e, r).toggleBlockquote().run(),
  callout: (e, r, v) =>
    at(e, r).insertContent({ type: 'callout', attrs: { variant: v ?? 'note' }, content: [{ type: 'paragraph' }] }).run(),
  codeBlock: (e, r) => at(e, r).toggleCodeBlock().run(),
  horizontalRule: (e, r) => at(e, r).setHorizontalRule().run(),
  table: (e, r) => {
    if (r) e.chain().focus().deleteRange(r).run()
    editorBridge.openTable((rows, cols) =>
      e.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run(),
    )
  },
  image: (e, r) => {
    if (r) e.chain().focus().deleteRange(r).run()
    editorBridge.openMedia({
      kind: 'image',
      onPick: ([a]) => a && insertAtom(e, { type: 'image', attrs: imageAttrs(a) }),
    })
  },
  imageGallery: (e, r) => {
    if (r) e.chain().focus().deleteRange(r).run()
    editorBridge.openMedia({
      kind: 'gallery',
      onPick: (assets) => {
        if (!assets.length) return
        const node = assets.length === 1
          ? { type: 'image', attrs: imageAttrs(assets[0]) }
          : { type: 'imageGallery', attrs: { items: assets.map(imageAttrs), height: 'md', caption: null } }
        insertAtom(e, node)
      },
    })
  },
  video: (e, r) => {
    if (r) e.chain().focus().deleteRange(r).run()
    editorBridge.openMedia({
      kind: 'video',
      onPick: ([a]) => {
        if (!a) return
        const youtube = a.source_type === 'youtube'
        insertAtom(e, {
          type: 'video',
          attrs: {
            source: youtube ? 'youtube' : 'cloudinary',
            asset_id: a.id,
            src: youtube ? `https://www.youtube-nocookie.com/embed/${a.external_id}` : a.url,
            external_id: youtube ? a.external_id : null,
            poster_url: a.thumbnail_url,
            title: a.title,
            duration_seconds: a.duration_seconds,
            caption: null,
          },
        })
      },
    })
  },
  embed: (e, r) => {
    if (r) e.chain().focus().deleteRange(r).run()
    editorBridge.openEmbed((attrs) => insertAtom(e, { type: 'embed', attrs }))
  },
}
