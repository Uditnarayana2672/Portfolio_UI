import type { APIRoute } from 'astro'
import { api } from '@udit/shared/api'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const GET: APIRoute = async ({ site }) => {
  const { items } = await api.blogs('?limit=30')
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>LighthouseInfo</title><link>${site}</link><description>Notes by Udit Narayana</description>${items
    .map((p) => `<item><title>${esc(p.title)}</title><link>${esc(p.url)}</link><guid>${esc(p.url)}</guid>${p.published_at ? `<pubDate>${new Date(p.published_at).toUTCString()}</pubDate>` : ''}<description>${esc(p.excerpt ?? '')}</description></item>`).join('')}</channel></rss>`
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml' } })
}
