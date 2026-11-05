import type { APIRoute } from 'astro'
import { api } from '@udit/shared/api'

export const GET: APIRoute = async ({ site }) => {
  const { items } = await api.projects('?limit=50&sort=newest')
  const urls = ['/', '/projects', ...items.map((p) => `/projects/${p.slug}`)]
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls
    .map((u) => `<url><loc>${new URL(u, site).href}</loc></url>`).join('')}</urlset>`
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } })
}
