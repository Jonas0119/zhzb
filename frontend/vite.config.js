import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    allowedHosts: [
      'localhost',
      'nonanesthetized-nolan-riantly.ngrok-free.dev',  // 添加您的ngrok主机
      '.ngrok-free.dev'  // 通配符，覆盖未来ngrok URL（推荐）
    ],
    host: '0.0.0.0',
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
})