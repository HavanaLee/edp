import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(rootDir, '..')

const datasetRoots: Record<string, string> = {
  'ds-pen': path.join(repoRoot, 'black_pen_to_wooden_stand', 'lerobot_data'),
  'ds-mouse': path.join(repoRoot, 'black_mouse_to_wooden_stand', 'lerobot_data'),
}

function contentType(file: string) {
  if (file.endsWith('.mp4')) return 'video/mp4'
  if (file.endsWith('.json')) return 'application/json'
  if (file.endsWith('.jsonl')) return 'application/x-ndjson'
  return 'application/octet-stream'
}

/** 开发/预览时把本地 LeRobot 视频挂到 /datasets/:id/... */
function serveLerobotDatasets(): Plugin {
  const mount = (middlewares: { use: Function }) => {
    middlewares.use('/datasets', (req: { url?: string }, res: any, next: () => void) => {
      const raw = decodeURIComponent((req.url ?? '').split('?')[0] || '')
      const parts = raw.split('/').filter(Boolean) // [ds-pen, videos, ...]
      const id = parts[0]
      const rel = parts.slice(1).join('/')
      const root = id ? datasetRoots[id] : undefined
      if (!root || !rel) return next()

      const file = path.resolve(root, rel)
      if (!file.startsWith(root)) return next()

      fs.stat(file, (err, st) => {
        if (err || !st.isFile()) return next()
        res.setHeader('Content-Type', contentType(file))
        res.setHeader('Accept-Ranges', 'bytes')
        fs.createReadStream(file).pipe(res)
      })
    })
  }

  return {
    name: 'serve-lerobot-datasets',
    configureServer(server) {
      mount(server.middlewares)
    },
    configurePreviewServer(server) {
      mount(server.middlewares)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), serveLerobotDatasets()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    fs: {
      allow: [rootDir, repoRoot],
    },
  },
})
