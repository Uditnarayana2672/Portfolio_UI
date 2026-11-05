// Runs after the build: old post addresses become permanent redirects on the host.
import { writeFileSync } from 'node:fs'

const base = `${(process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '')}/api/v1`
const res = await fetch(`${base}/blog-redirects`)
if (!res.ok) throw new Error(`Could not load redirects: HTTP ${res.status}`)
const { items } = await res.json()
writeFileSync('dist/_redirects', items.map((r) => `${r.from} ${r.to} 301`).join('\n') + '\n')
console.log(`Wrote ${items.length} redirect(s).`)
