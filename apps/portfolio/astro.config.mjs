import { defineConfig } from 'astro/config'
import react from '@astrojs/react'

export default defineConfig({
  site: 'https://uditworks.com',
  output: 'static',
  integrations: [react()],
  vite: { ssr: { noExternal: [/^@udit\//] } },
})
