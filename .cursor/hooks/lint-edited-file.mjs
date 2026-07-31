import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { dirname, extname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const cacheDir = resolve(rootDir, '.cursor/hooks/.cache')
const failurePath = resolve(cacheDir, 'last-lint-failure.json')

function readStdin() {
  return readFileSync(0, 'utf8')
}

const raw = readStdin()
let payload = {}
try {
  payload = JSON.parse(raw || '{}')
} catch {
  process.exit(0)
}

const filePath = String(payload.file_path ?? '')
if (!filePath) process.exit(0)

const rel = relative(rootDir, filePath).replace(/\\/g, '/')
const ext = extname(filePath)
const lintable = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(ext)
const underSrc = rel.startsWith('src/')

if (!lintable || !underSrc) process.exit(0)

const result = spawnSync('npx', ['oxlint', filePath], {
  cwd: rootDir,
  encoding: 'utf8',
  shell: true,
})

const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim()
mkdirSync(cacheDir, { recursive: true })

if (result.status !== 0) {
  writeFileSync(
    failurePath,
    JSON.stringify(
      {
        file: rel,
        exitCode: result.status,
        output: output.slice(0, 4000),
        at: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  )
} else {
  try {
    writeFileSync(failurePath, '', 'utf8')
  } catch {
    // ignore
  }
}

process.exit(0)
