import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Sistema OT - K.A.B.J.',
        short_name: 'Sistema OT',
        description: 'Gestión de Órdenes de Trabajo en Campo',
        theme_color: '#1B4F72',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        lang: 'es',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/favicon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,jpg}'],
        // Sin cache de /api: datos sensibles y offline ya usa IndexedDB
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
            return 'leaflet'
          }
          if (id.includes('node_modules/xlsx')) return 'xlsx'
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')
            || id.includes('node_modules/react-router')) {
            return 'vendor'
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['xlsx'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
