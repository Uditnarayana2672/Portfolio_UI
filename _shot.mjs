import { chromium } from 'playwright'

const BASE = 'http://localhost:5174/admin/media'
const OUT = '/tmp/shots'
import { mkdirSync } from 'fs'
mkdirSync(OUT, { recursive: true })

const now = '2026-06-01T10:00:00Z'
function asset(o) {
  return {
    id: o.id, cloudinary_url: o.cloudinary_url ?? null, public_id: o.public_id ?? null,
    resource_type: o.resource_type, format: o.format ?? null, width: o.width ?? null,
    height: o.height ?? null, file_size: o.file_size ?? null, file_name: o.file_name,
    folder: o.folder, alt_text: o.alt_text ?? null, source_type: o.source_type ?? 'cloudinary',
    external_id: o.external_id ?? null, video_title: o.video_title ?? null,
    thumbnail_url: o.thumbnail_url ?? null, video_duration_seconds: o.video_duration_seconds ?? null,
    is_orphan: false, cdn_status: 'ok', uploaded_by: null, uploaded_by_name: 'Udit N.',
    created_at: now, updated_at: now,
  }
}
const assets = [
  asset({ id: '11111111-1111-1111-1111-111111111111', resource_type: 'image', format: 'jpg', width: 1600, height: 900, file_size: 1247832, file_name: 'lighthouse-hero-shot.jpg', folder: 'projects/thumbnails', cloudinary_url: 'https://picsum.photos/seed/a/400/300' }),
  asset({ id: '22222222-2222-2222-2222-222222222222', resource_type: 'image', format: 'png', width: 1200, height: 630, file_size: 248000, file_name: 'og-portfolio-2026.png', folder: 'system/og-images', cloudinary_url: 'https://picsum.photos/seed/b/400/300' }),
  asset({ id: '33333333-3333-3333-3333-333333333333', resource_type: 'video', format: null, width: null, height: null, file_size: null, file_name: 'Ravi Teja Comedy Scenes', folder: 'blog/inline', source_type: 'youtube', external_id: 'al4Dm-DauPc', video_title: 'Ravi Teja Comedy Scenes', thumbnail_url: 'https://img.youtube.com/vi/al4Dm-DauPc/hqdefault.jpg', video_duration_seconds: 90 }),
  asset({ id: '44444444-4444-4444-4444-444444444444', resource_type: 'image', format: 'webp', width: 2400, height: 1600, file_size: 312000, file_name: 'building-jerry-cover.webp', folder: 'blog/covers', cloudinary_url: 'https://picsum.photos/seed/d/400/300' }),
  asset({ id: '55555555-5555-5555-5555-555555555555', resource_type: 'raw', format: 'pdf', width: 12, height: null, file_size: 184000, file_name: 'udit-resume-2026.pdf', folder: 'uncategorized' }),
  asset({ id: '66666666-6666-6666-6666-666666666666', resource_type: 'image', format: 'jpg', width: 1600, height: 1067, file_size: 980000, file_name: 'stairwell-light-leak.jpg', folder: 'blog/covers', cloudinary_url: 'https://picsum.photos/seed/f/400/300' }),
]
const folder_stats = { 'blog/covers': 2, 'blog/inline': 1, 'projects/thumbnails': 1, 'system/og-images': 1, 'uncategorized': 1 }
const type_stats = { image: 4, video: 1, raw: 1 }
const listBody = { assets, total: 84, page: 1, limit: 50, folder_stats, type_stats }
const statsBody = { total_assets: 84, added_today: 4, counts: { image: 71, video: 9, raw: 4 },
  storage: { used_bytes: 1503238553, quota_bytes: 2415919104, used_human: '1.4 GB', quota_human: '2.25 GB', percent_used: 62, plan: 'PLUS' }, last_cleanup: null }

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()

await page.route('**/api/v1/admin/media**', (route) => {
  const url = route.request().url()
  const json = (b) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(b) })
  if (url.includes('/stats')) return json(statsBody)
  if (url.includes('/usage')) return json({ asset_id: '0', usage_count: 0, references: [] })
  const m = url.match(/\/admin\/media\/([0-9a-f-]{36})(\?|$)/)
  if (m) { const a = assets.find(x => x.id === m[1]) || assets[0]; return json({ ...a, usage_count: 0 }) }
  return json(listBody)
})

page.on('console', (m) => { if (m.type() === 'error') console.log('PAGE ERR:', m.text()) })

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.screenshot({ path: `${OUT}/mobile-default.png`, fullPage: true })
console.log('cards on page:', await page.locator('text=lighthouse-hero-shot.jpg').count())

// open hamburger nav
await page.click('[aria-label="Open menu"]')
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/mobile-nav.png` })

// close nav (Escape), open a card -> bottom sheet
await page.keyboard.press('Escape')
await page.waitForTimeout(400)
await page.click('text=lighthouse-hero-shot.jpg')
await page.waitForTimeout(900)
await page.screenshot({ path: `${OUT}/mobile-sheet.png` })

// desktop sanity
const dctx = await browser.newContext({ viewport: { width: 1280, height: 850 } })
const dpage = await dctx.newPage()
await dpage.route('**/api/v1/admin/media**', (route) => {
  const url = route.request().url()
  const json = (b) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(b) })
  if (url.includes('/stats')) return json(statsBody)
  if (url.includes('/usage')) return json({ asset_id: '0', usage_count: 0, references: [] })
  const m = url.match(/\/admin\/media\/([0-9a-f-]{36})(\?|$)/)
  if (m) { const a = assets.find(x => x.id === m[1]) || assets[0]; return json({ ...a, usage_count: 0 }) }
  return json(listBody)
})
await dpage.goto(BASE, { waitUntil: 'networkidle' })
await dpage.waitForTimeout(1000)
await dpage.screenshot({ path: `${OUT}/desktop-default.png` })

await browser.close()
console.log('DONE')
