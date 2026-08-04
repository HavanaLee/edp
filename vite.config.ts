import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

/**
 * LeRobot mock 数据在 public/datasets/{ds-pen|ds-mouse}/
 * 开发时直接以 /datasets/... 静态访问，无需再挂仓库外目录。
 *
 * BASE_PATH：GitHub Pages 项目页需设为 /edp/（见 .github/workflows/deploy.yml）；
 * 本地开发保持默认 /，避免静态资源与路由前缀错位。
 */
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})

