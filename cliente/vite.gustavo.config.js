import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist-gustavo', rollupOptions: { input: fileURLToPath(new URL('./gustavo.html', import.meta.url)) } }
})
