import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Port 8080 supaya origin cocok dengan FRONTEND_URL di .env backend
    // (CORS backend hanya mengizinkan origin itu). strictPort: true supaya
    // kalau port sudah dipakai, server gagal keras dan tidak diam-diam
    // pindah port (yang akan merusak CORS).
    port: 8080,
    strictPort: true,
  },
})
