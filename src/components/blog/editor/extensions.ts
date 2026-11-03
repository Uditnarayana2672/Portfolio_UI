import { Extension, Node, ReactNodeViewRenderer, ReactRenderer, textblockTypeInputRule } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Heading } from '@tiptap/extension-heading'
import { Blockquote } from '@tiptap/extension-blockquote'
import { ListItem } from '@tiptap/extension-list'
import { Link } from '@tiptap/extension-link'
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import { Highlight } from '@tiptap/extension-highlight'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { CharacterCount, Placeholder } from '@tiptap/extensions'
import { Suggestion } from '@tiptap/suggestion'
import type { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion'
import { PluginKey } from '@tiptap/pm/state'
import { common, createLowlight } from 'lowlight'
import { editorBridge } from './editorBridge'
import {
  CalloutView,
  CodeBlockView,
  EmbedView,
  GalleryView,
  ImageView,
  QuoteView,
  VideoView,
} from './nodeViews'
import SlashMenu, { type SlashItem, type SlashMenuHandle } from './SlashMenu'

// Every schema below mirrors the server allowlist (app/domain/blog/
// content_schema.py) so the editor can't produce a document autosave rejects.

const lowlight = createLowlight(common)

/** Attribute stored in JSON only (no DOM attribute). */
const jsonAttr = (fallback: unknown = null) => ({
  default: fallback,
  parseHTML: () => fallback,
  renderHTML: () => ({}),
})

const BlogHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      numbered: {
        default: false,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-numbered') === 'true',
        renderHTML: (attrs: { numbered?: boolean }) => (attrs.numbered ? { 'data-numbered': 'true' } : {}),
      },
    }
  },
  addInputRules() {
    return [
      ...(this.parent?.() ?? []),
      // "#. " → numbered sub-heading (the number is computed, never typed).
      textblockTypeInputRule({ find: /^#\.\s$/, type: this.type, getAttributes: { level: 3, numbered: true } }),
    ]
  },
}).configure({ levels: [2, 3, 4] })

const BlogBlockquote = Blockquote.extend({
  content: '(paragraph|bulletList|orderedList)+',
  addAttributes() {
    return {
      attribution: jsonAttr(),
      cite_url: jsonAttr(),
      variant: jsonAttr('default'),
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(QuoteView)
  },
})

const BlogListItem = ListItem.extend({
  content: 'paragraph (paragraph|bulletList|orderedList|codeBlock|image|callout|blockquote)*',
})

/** Shift+Enter inside a list point = a new paragraph in the same point (no new number). */
const ListParagraphBreak = Extension.create({
  name: 'listParagraphBreak',
  priority: 1000,
  addKeyboardShortcuts() {
    return {
      'Shift-Enter': () => this.editor.isActive('listItem') && this.editor.commands.splitBlock(),
      'Mod-k': () => {
        editorBridge.openLink(this.editor)
        return true
      },
    }
  },
})

const BlogLink = Link.extend({
  addAttributes() {
    return { ...this.parent?.(), internal: jsonAttr() }
  },
}).configure({
  openOnClick: false,
  autolink: true,
  linkOnPaste: true,
  defaultProtocol: 'https',
  HTMLAttributes: { target: null, rel: 'noopener noreferrer' },
})

const BlogTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      header_style: {
        default: 'ink',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-head') ?? 'ink',
        renderHTML: (a: { header_style?: string }) => ({ 'data-head': a.header_style ?? 'ink' }),
      },
      striped: {
        default: false,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-striped') === 'true',
        renderHTML: (a: { striped?: boolean }) => (a.striped ? { 'data-striped': 'true' } : {}),
      },
      border: {
        default: 'grid',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-border') ?? 'grid',
        renderHTML: (a: { border?: string }) => ({ 'data-border': a.border ?? 'grid' }),
      },
    }
  },
}).configure({ resizable: true })

const cellAttrs = {
  background: {
    default: null,
    parseHTML: (el: HTMLElement) => el.getAttribute('data-bg'),
    renderHTML: (a: { background?: string | null }) => (a.background ? { 'data-bg': a.background } : {}),
  },
  align: {
    default: null,
    parseHTML: (el: HTMLElement) => el.getAttribute('data-align'),
    renderHTML: (a: { align?: string | null }) => (a.align ? { 'data-align': a.align } : {}),
  },
}

const BlogTableCell = TableCell.extend({
  content: '(paragraph|bulletList|orderedList)+',
  addAttributes() {
    return { ...this.parent?.(), ...cellAttrs }
  },
})

const BlogTableHeader = TableHeader.extend({
  content: '(paragraph|bulletList|orderedList)+',
  addAttributes() {
    return { ...this.parent?.(), ...cellAttrs }
  },
})

const BlogCodeBlock = CodeBlockLowlight.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      filename: jsonAttr(),
      show_line_numbers: jsonAttr(false),
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView)
  },
}).configure({ lowlight, defaultLanguage: 'plaintext' })

const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: '(paragraph|bulletList|orderedList|codeBlock)+',
  defining: true,
  addAttributes() {
    return { variant: jsonAttr('note'), icon: jsonAttr(), title: jsonAttr() }
  },
  parseHTML() {
    return [{ tag: 'aside[data-callout]' }]
  },
  renderHTML() {
    return ['aside', { 'data-callout': '' }, 0]
  },
  addNodeView() {
    return ReactNodeViewRenderer(CalloutView)
  },
})

function atomNode(name: string, attrs: Record<string, unknown>, view: typeof ImageView) {
  return Node.create({
    name,
    group: 'block',
    atom: true,
    draggable: true,
    selectable: true,
    addAttributes() {
      return Object.fromEntries(Object.entries(attrs).map(([k, v]) => [k, jsonAttr(v)]))
    },
    parseHTML() {
      return [{ tag: `figure[data-blog-${name}]` }]
    },
    renderHTML() {
      return ['figure', { [`data-blog-${name}`]: '' }]
    },
    addNodeView() {
      return ReactNodeViewRenderer(view)
    },
  })
}

const BlogImage = atomNode('image', {
  asset_id: null, public_id: null, src: null, alt: null, caption: null,
  width: null, height: null, size: 'normal', link_href: null,
}, ImageView)

const ImageGallery = atomNode('imageGallery', { items: [], height: 'md', caption: null }, GalleryView)

const Video = atomNode('video', {
  source: null, asset_id: null, src: null, external_id: null, poster_url: null,
  title: null, duration_seconds: null, caption: null, start_seconds: null,
}, VideoView)

const Embed = atomNode('embed', {
  provider: null, original_url: null, embed_url: null, title: null, height: 420,
}, EmbedView)

// ── slash menu ───────────────────────────────────────────────────────────────

export function createSlashCommand(getItems: (query: string) => SlashItem[]) {
  return Extension.create({
    name: 'slashCommand',
    addProseMirrorPlugins() {
      return [
        Suggestion<SlashItem>({
          editor: this.editor,
          pluginKey: new PluginKey('slashCommand'),
          char: '/',
          allowSpaces: false,
          // Not inside code: "/" is a normal character there.
          allow: ({ editor }) => !editor.isActive('codeBlock'),
          items: ({ query }) => getItems(query),
          command: ({ editor, range, props }) => props.run(editor as Editor, range),
          render: () => {
            let renderer: ReactRenderer<SlashMenuHandle> | null = null
            const place = (props: SuggestionProps<SlashItem>) => {
              const rect = props.clientRect?.()
              const el = renderer?.element as HTMLElement | undefined
              if (!rect || !el) return
              el.style.position = 'fixed'
              el.style.zIndex = '80'
              const below = rect.bottom + 6
              const fitsBelow = below + 320 < window.innerHeight
              el.style.left = `${Math.min(rect.left, window.innerWidth - 300)}px`
              el.style.top = fitsBelow ? `${below}px` : `${Math.max(8, rect.top - 326)}px`
            }
            return {
              onStart: (props) => {
                renderer = new ReactRenderer(SlashMenu, { props, editor: props.editor })
                document.body.appendChild(renderer.element)
                place(props)
              },
              onUpdate: (props) => {
                renderer?.updateProps(props)
                place(props)
              },
              onKeyDown: (props: SuggestionKeyDownProps) => {
                if (props.event.key === 'Escape') {
                  renderer?.element.remove()
                  renderer?.destroy()
                  renderer = null
                  return true
                }
                return renderer?.ref?.onKeyDown(props.event) ?? false
              },
              onExit: () => {
                renderer?.element.remove()
                renderer?.destroy()
                renderer = null
              },
            }
          },
        }),
      ]
    },
  })
}

export function buildExtensions(getSlashItems: (query: string) => SlashItem[]) {
  return [
    StarterKit.configure({
      heading: false,
      blockquote: false,
      codeBlock: false,
      listItem: false,
      link: false,
    }),
    BlogHeading,
    BlogBlockquote,
    BlogListItem,
    ListParagraphBreak,
    BlogLink,
    BlogTable,
    TableRow,
    BlogTableHeader,
    BlogTableCell,
    BlogCodeBlock,
    Highlight.configure({ multicolor: true }),
    Callout,
    BlogImage,
    ImageGallery,
    Video,
    Embed,
    Placeholder.configure({
      placeholder: ({ node }) =>
        node.type.name === 'heading' ? 'Heading' : 'Start writing, or press / to insert a block…',
      includeChildren: false,
    }),
    CharacterCount,
    createSlashCommand(getSlashItems),
  ]
}
