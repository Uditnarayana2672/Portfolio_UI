export type BlockId =
  | 'hero' | 'text' | 'image' | 'code' | 'video'
  | 'comparison' | 'poll' | 'stats' | 'quote'
  | 'gallery' | 'timeline' | 'cta' | 'form' | 'embed'

export interface BlockTypeDef {
  id: BlockId
  label: string
  icon: string
  pickerLabel: string
  placeholder: string
}

export const BLOCK_TYPES: BlockTypeDef[] = [
  { id: 'hero',       label: 'Hero Image',    icon: 'Hero', pickerLabel: 'Hero',     placeholder: 'add a hero image · full-width banner' },
  { id: 'text',       label: 'Text',          icon: 'Txt',  pickerLabel: 'Text',     placeholder: 'click ✎ to write…' },
  { id: 'image',      label: 'Image',         icon: 'Img',  pickerLabel: 'Image',    placeholder: 'upload an inline image' },
  { id: 'code',       label: 'Code Snippet',  icon: '{ }',  pickerLabel: 'Code',     placeholder: 'paste a code block · syntax highlighted' },
  { id: 'video',      label: 'Video',         icon: '▶',    pickerLabel: 'Video',    placeholder: 'embed a video · YouTube, Vimeo, mp4' },
  { id: 'comparison', label: 'Comparison',    icon: '⎘',    pickerLabel: 'Compare',  placeholder: 'before / after, A vs B' },
  { id: 'poll',       label: 'Poll',          icon: '☑',    pickerLabel: 'Poll',     placeholder: 'configure a poll question' },
  { id: 'stats',      label: 'Stats Strip',   icon: '▦',    pickerLabel: 'Stats',    placeholder: 'add 3–5 numeric stats' },
  { id: 'quote',      label: 'Quote',         icon: '"❞',   pickerLabel: 'Quote',    placeholder: 'pull quote · with attribution' },
  { id: 'gallery',    label: 'Gallery',       icon: '▤',    pickerLabel: 'Gallery',  placeholder: 'image grid · drop multiple' },
  { id: 'timeline',   label: 'Timeline',      icon: '⏱',    pickerLabel: 'Timeline', placeholder: 'add timeline events' },
  { id: 'cta',        label: 'CTA',           icon: '→',    pickerLabel: 'CTA',      placeholder: 'add a call-to-action button' },
  { id: 'form',       label: 'Feedback Form', icon: '✎',    pickerLabel: 'Form',     placeholder: 'connect a feedback form' },
  { id: 'embed',      label: 'Embed',         icon: '◳',    pickerLabel: 'Embed',    placeholder: 'embed a sandbox · CodeSandbox, Figma, demo' },
]

export const TYPE_BY_ID: Record<BlockId, BlockTypeDef> = Object.fromEntries(
  BLOCK_TYPES.map((t) => [t.id, t])
) as Record<BlockId, BlockTypeDef>

export function previewText(typeId: BlockId, data: Record<string, unknown>): string {
  const fallback = TYPE_BY_ID[typeId].placeholder
  switch (typeId) {
    case 'hero': {
      const url = (data.imageUrl as string) ?? ''
      return url ? `hero: ${url.split('/').pop() ?? url}` : fallback
    }
    case 'text': {
      const html = (data.html as string) ?? ''
      if (!html) return fallback
      const text = html.replace(/<[^>]+>/g, '').trim()
      return text ? (text.length > 60 ? text.slice(0, 60) + '…' : text) : fallback
    }
    case 'image': {
      const caption = (data.caption as string) ?? ''
      const url = (data.imageUrl as string) ?? ''
      return caption || (url ? (url.split('/').pop() ?? url) : '') || fallback
    }
    case 'code': {
      const fn = (data.filename as string) ?? ''
      const lang = (data.language as string) ?? ''
      return fn ? `${fn} · ${lang}` : lang || fallback
    }
    case 'cta': {
      const label = (data.label as string) ?? ''
      const url = (data.url as string) ?? ''
      return label ? `→ ${label}${url ? ' · ' + url : ''}` : fallback
    }
    case 'video': {
      const url = (data.embedUrl as string) ?? ''
      const caption = (data.caption as string) ?? ''
      return caption || url || fallback
    }
    case 'comparison': {
      const l = (data.leftLabel as string) ?? 'Before'
      const r = (data.rightLabel as string) ?? 'After'
      return `${l} vs ${r}`
    }
    case 'poll': {
      const q = (data.question as string) ?? ''
      return q || fallback
    }
    case 'stats': {
      const metrics = data.metrics as Array<{ value: string; label: string }> | undefined
      if (!metrics?.length) return fallback
      return metrics.map((m) => `${m.value} ${m.label}`.trim()).filter(Boolean).join(' · ') || fallback
    }
    case 'quote': {
      const text = (data.text as string) ?? ''
      const name = (data.name as string) ?? ''
      if (!text) return fallback
      const short = text.length > 50 ? text.slice(0, 50) + '…' : text
      return name ? `"${short}" — ${name}` : `"${short}"`
    }
    case 'gallery': {
      const images = data.images as unknown[] | undefined
      const layout = (data.layout as string) ?? 'grid'
      return images?.length ? `${images.length} image${images.length !== 1 ? 's' : ''} · ${layout}` : fallback
    }
    case 'timeline': {
      const entries = data.entries as Array<{ title: string }> | undefined
      return entries?.length ? `${entries.length} entr${entries.length !== 1 ? 'ies' : 'y'}` : fallback
    }
    case 'form': {
      const name = (data.formName as string) ?? ''
      return name || fallback
    }
    case 'embed': {
      const url = (data.embedUrl as string) ?? ''
      const prov = (data.provider as string) ?? ''
      return url ? `${prov ? prov + ' · ' : ''}${url}` : fallback
    }
    default:
      return fallback
  }
}

export function defaultEditorData(typeId: BlockId): Record<string, unknown> {
  switch (typeId) {
    case 'hero':       return { imageUrl: '', altText: '', height: 'standard', showCaption: false, caption: '' }
    case 'text':       return { html: '' }
    case 'image':      return { imageUrl: '', caption: '', size: 'full', align: 'center' }
    case 'code':       return { code: '', language: 'javascript', filename: '' }
    case 'video':      return { tab: 'embed', embedUrl: '', caption: '', autoplay: false }
    case 'comparison': return { leftLabel: 'Before', leftContent: '', rightLabel: 'After', rightContent: '' }
    case 'poll':       return { question: '', options: ['', ''], anonymous: false, showResults: true, expiry: '' }
    case 'stats':      return { metrics: [{ value: '', label: '' }, { value: '', label: '' }] }
    case 'quote':      return { text: '', name: '', role: '', style: 'blockquote' }
    case 'gallery':    return { images: [], layout: 'grid' }
    case 'timeline':   return { entries: [{ date: '', title: '', description: '' }] }
    case 'cta':        return { label: 'Learn more', url: '', style: 'primary', align: 'center', subtext: '' }
    case 'form':       return { formId: '', formName: '' }
    case 'embed':      return { embedUrl: '', provider: '', sourceLabel: '', caption: '', height: 480, allowFullscreen: true }
  }
}
