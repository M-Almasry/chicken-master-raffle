import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Custom rewrite for Admin SPA within MPA
    proxy: {
      '^/admin(/.*)?$': {
        target: 'http://localhost:5173',
        rewrite: () => '/admin.html',
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        store: resolve(__dirname, 'store.html'),
        register: resolve(__dirname, 'register.html'),
        success: resolve(__dirname, 'success.html'),
        admin: resolve(__dirname, 'admin.html'),
        track: resolve(__dirname, 'track.html'),
      },
    },
  },
})
