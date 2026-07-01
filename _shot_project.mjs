import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const BASE = process.env.PDX_BASE || 'http://localhost:5176'
const SLUG = 'jerry-public-ai-assistant'
const OUT = '/tmp/pdshots'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()

// desktop
const dctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 })
const dpage = await dctx.newPage()
dpage.on('console', (m) => { if (m.type() === 'error') console.log('PAGE ERR:', m.text()) })
dpage.on('pageerror', (e) => console.log('PAGE EXC:', e.message))
await dpage.goto(`${BASE}/projects/${SLUG}`, { waitUntil: 'networkidle' })
await dpage.waitForTimeout(1500)
console.log('h1:', await dpage.locator('.pdx h1').first().textContent().catch(() => 'NONE'))
console.log('eyebrows:', await dpage.locator('.pdx .eyebrow').count())
console.log('metrics:', await dpage.locator('.pdx .metric').count())
console.log('timeline items:', await dpage.locator('.pdx .tl-item').count())
console.log('react btns:', await dpage.locator('.pdx .react-btn').count())
await dpage.screenshot({ path: `${OUT}/desktop-full.png`, fullPage: true })
await dpage.screenshot({ path: `${OUT}/desktop-fold.png` })

// mobile
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const mpage = await mctx.newPage()
await mpage.goto(`${BASE}/projects/${SLUG}`, { waitUntil: 'networkidle' })
await mpage.waitForTimeout(1200)
await mpage.screenshot({ path: `${OUT}/mobile-fold.png` })

await browser.close()
console.log('DONE')
