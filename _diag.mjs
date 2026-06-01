import { chromium } from 'playwright'
const BASE = 'http://localhost:5174/admin/media'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const errs = []
page.on('console', m => { if (m.type()==='error') errs.push(m.text()) })
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message))
await page.route('**/api/v1/admin/media**', r => r.fulfill({ status:200, contentType:'application/json', body: JSON.stringify({assets:[],total:0,page:1,limit:50,folder_stats:{},type_stats:{}}) }))
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)
const title = await page.title()
const h1 = await page.locator('h1').first().textContent().catch(()=>'(no h1)')
const bodyLen = (await page.content()).length
const hamburger = await page.locator('[aria-label="Open menu"]').count()
console.log('TITLE:', title)
console.log('H1:', h1)
console.log('BODY_LEN:', bodyLen)
console.log('HAMBURGER_COUNT:', hamburger)
console.log('ERRORS:', errs.slice(0,8).join('\n  '))
await page.screenshot({ path: '/tmp/shots/diag.png', fullPage: true })
await browser.close()
