import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // devモードでもS3から練習問題を取得する
  server: {
    proxy: {
      "/api": {
        target: "https://aspsz9mjw3.execute-api.ap-northeast-1.amazonaws.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, "/prod"),
      },
    },
  },
})