import type { BlogCard } from '@udit/shared/types'

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Place one related card after the second section of a post. */
export function withInlineRelated(html: string, related: BlogCard | undefined): string {
  if (!related) return html
  const image = related.cover?.url ? `<img src="${escapeHtml(related.cover.url)}" alt="" loading="lazy">` : ''
  const card = `<a class="inline-related" href="/blog/${encodeURIComponent(related.slug)}">${image}<span><span class="eb">Related</span><b>${escapeHtml(related.title)}</b></span></a>`
  const headings = [...html.matchAll(/<h2[\s>]/g)]
  const at = headings[2]?.index ?? headings[1]?.index
  return at === undefined ? html : `${html.slice(0, at)}${card}${html.slice(at)}`
}
