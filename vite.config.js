import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Service Provider marketplace service (isolated DB + identity)
      '/api/sp': {
        target: 'http://localhost:4003',
        changeOrigin: true,
      },
    },
  },
})
