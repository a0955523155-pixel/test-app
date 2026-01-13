import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 1. 將警告門檻調高到 1500kb (消除黃字警告)
    chunkSizeWarningLimit: 1500,
    
    // 2. 進行分包 (Code Splitting)，把大套件獨立出來
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 把 node_modules 裡面的東西分開打包
          if (id.includes('node_modules')) {
            // 如果是 xlsx 套件，獨立成一個檔案
            if (id.includes('xlsx')) {
              return 'xlsx';
            }
            // 如果是 firebase 相關，獨立成一個檔案
            if (id.includes('firebase')) {
              return 'firebase';
            }
            // 其他第三方套件包成 vendor
            return 'vendor';
          }
        }
      }
    }
  }
})