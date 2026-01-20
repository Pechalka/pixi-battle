import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// eslint-disable-next-line no-undef
const isDev = process.env?.NODE_ENV !== 'production';

const PROXY = process.env.PROXY_PORT || '9000';
const PORT = process.env.PORT || '4000';

console.log(`start PORT:${PORT} PROXY:${PROXY}`)
export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: 'jsx',
  },
  server: {
    port: PORT,
    proxy: isDev ? {
      '/api': `http://localhost:${PROXY}`,
       "/socket.io": {
            target: `ws://localhost:${PROXY}`,
            ws: true,
          },
    } : {}
  },
  build: {
    outDir: './dist/',
    emptyOutDir: true
  }
})
