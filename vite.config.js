import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      // Changed from 'autoUpdate' to 'prompt' so the onNeedRefresh callback
      // in main.jsx actually fires. With 'autoUpdate', the SW bypasses the
      // callback entirely and force-updates mid-session regardless.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'SiteTracker',
        short_name: 'SiteTracker',
        description: 'Construction Expense Tracker',
        theme_color: '#0f172a',
        background_color: '#FBEDD0',
        display: 'standalone',
        icons: [
          {
            src: 'icons.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'icons.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ]
})
