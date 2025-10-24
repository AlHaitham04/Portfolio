import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // create a separate chunk for large dependencies
          'vue-vendor': ['vue', 'vue-router'],
          'charting': ['chart.js', 'recharts']
        }
      }
    }
  }
})
