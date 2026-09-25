import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    hmr: { clientPort: 443 },
    cors: true,
    allowedHosts: true,
    headers: { 'X-Frame-Options': 'ALLOWALL' }
  },
  preview: {
    host: '0.0.0.0',
    port: 5173
  }
})
