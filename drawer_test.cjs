const { chromium } = require('@playwright/test')

async function run() {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } })
  const page = await ctx.newPage()

  const errors = []
  page.on('console', msg => { 
    if (msg.type() === 'error') errors.push(msg.text()) 
  })
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message))

  await page.goto('http://localhost:5173/admin/media', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  
  const bodyHTML = await page.evaluate(() => document.body.innerHTML.slice(0, 1000))
  console.log('Body HTML:', bodyHTML)
  console.log('Errors:', errors)
  
  await page.screenshot({ path: '/tmp/drawer_1_grid.png', fullPage: false })

  await browser.close()
}
run().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
