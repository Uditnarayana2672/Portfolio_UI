import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const msgs = [];
page.on('console', m => msgs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', e => msgs.push(`[ERR] ${e.message}`));

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML?.substring(0, 300) || 'empty');
console.log('Root HTML:', rootHtml);
const errors = msgs.filter(m => m.includes('ERR') || m.includes('error'));
console.log('Errors:', errors);
await browser.close();
