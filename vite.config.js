import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1', // bind 127.0.0.1 only (internal to host, accessed via Caddy)
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:4000',
      '/admin': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000',
      '/farm': 'http://localhost:4001',
      '/workers': 'http://localhost:4002',
      '/attendance': 'http://localhost:4002',
      '/finance': 'http://localhost:4002',
      '/api/sp': {
        target: 'http://localhost:4003',
        changeOrigin: true,
      },
    },
  },
})
