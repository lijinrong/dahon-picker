import { defineConfig } from 'astro/config'
import vue from '@astrojs/vue'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  integrations: [vue(), sitemap()],
  site: 'https://lijinrong.github.io',
  base: '/dahon-picker/',
})
