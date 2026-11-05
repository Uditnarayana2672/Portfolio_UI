import { defineConfig } from 'astro/config'
import react from '@astrojs/react'

export default defineConfig({
  site: 'https://lighthouseinfo.com',
  output: 'static',
  integrations: [react()],
  vite: { ssr: { noExternal: [/^@udit\//] } },
})
