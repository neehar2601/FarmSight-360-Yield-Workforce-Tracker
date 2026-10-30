import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // bind 0.0.0.0 (reachable from LAN / containers)
    proxy: {
      // Service Provider marketplace service (isolated DB + identity)
      '/api/sp': {
        target: 'http://localhost:4003',
        changeOrigin: true,
      },
    },
  },
})
