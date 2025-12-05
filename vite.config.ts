import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/yanik-oyunu/',
  build: {
    outDir: 'docs',               // dist yerine docs klasörü
  },
})