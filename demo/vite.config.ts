import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // 确保只使用一个 React 实例
      'react': path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom']
  },
  server: {
    fs: {
      // 允许访问项目根目录之外的文件
      allow: [
        '..',
        '../..',
        path.resolve('../')
      ]
    }
  }
})
