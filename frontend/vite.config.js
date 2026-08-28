import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Catch any request starting with /api and redirect it to your Express port
      '/api': {
        target: 'http://localhost:5000', // ─── CHANGE THIS TO YOUR BACKEND PORT ───
        changeOrigin: true,
        secure: false,
      }
    }
}
})
