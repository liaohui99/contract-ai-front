import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/taorunhui': {
        target: 'http://192.168.110.244:7341',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log('Proxying request:', req.url)
          })
          proxy.on('proxyRes', (proxyRes) => {
            console.log('Received response:', proxyRes.statusCode)
          })
          proxy.on('error', (err) => {
            console.error('Proxy error:', err)
          })
        },
      },
    },
  },
})
