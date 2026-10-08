import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

const core = fileURLToPath(new URL('../src/core', import.meta.url));

export default defineConfig({
  resolve: { alias: { '@core': core } },
  server: { fs: { allow: ['..'] } },
  worker: { format: 'es' },
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'AutoCompleteHelp',
        short_name: 'AutoCompleteHelp',
        description: 'Aprender a programar escribiendo cada línea de proyectos reales.',
        lang: 'es',
        theme_color: '#1d3557',
        background_color: '#f6f8fb',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Dependencias de los proyectos (gsap, etc.) para la vista previa: offline después de la primera vez.
            urlPattern: /^https:\/\/esm\.sh\//,
            handler: 'CacheFirst',
            options: { cacheName: 'esm-sh', expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 60 } }
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'fonts' }
          }
        ]
      }
    })
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
});
