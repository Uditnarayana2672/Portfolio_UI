import type { APIRoute } from 'astro'
import { api } from '@udit/shared/api'

export const GET: APIRoute = async ({ site }) => {
  const [{ items }, categories, tags] = await Promise.all([api.blogs('?limit=50'), api.blogCategories(), api.blogTags()])
  const urls = ['/', ...items.map((p) => `/blog/${p.slug}`),
    ...categories.items.filter((c) => c.post_count).map((c) => `/blog/category/${c.slug}`),
    ...tags.items.map((t) => `/blog/tag/${encodeURIComponent(t.tag)}`)]
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls
    .map((u) => `<url><loc>${new URL(u, site).href}</loc></url>`).join('')}</urlset>`
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } })
}
