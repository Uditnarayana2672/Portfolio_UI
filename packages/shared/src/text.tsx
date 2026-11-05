import { Fragment } from 'react'

/** Admin text marks highlights with *stars*. Everything stays plain text, never HTML. */
export function Highlighted({ text, as: Tag = 'em' }: { text: string; as?: 'em' | 'b' }) {
  const parts = text.split(/\*([^*]+)\*/g)
  return (
    <>
      {parts.map((part, i) => (i % 2 ? <Tag key={i}>{part}</Tag> : <Fragment key={i}>{part}</Fragment>))}
    </>
  )
}

export function highlightedHtml(text: string, tag = 'em'): string {
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return escape(text).replace(/\*([^*]+)\*/g, `<${tag}>$1</${tag}>`)
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
}
