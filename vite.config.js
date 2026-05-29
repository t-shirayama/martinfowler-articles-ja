import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/martinfowler-articles-ja/',
  plugins: [react()],
})
