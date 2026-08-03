import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const failurePath = resolve(rootDir, '.cursor/hooks/.cache/last-lint-failure.json')

function readStdin() {
  try {
    return readFileSync(0, 'utf8')
  } catch {
    return '{}'
  }
}

function out(obj) {
  process.stdout.write(JSON.stringify(obj))
}

const raw = readStdin()
let payload = {}
try {
  payload = JSON.parse(raw || '{}')
} catch {
  payload = {}
}

if (!existsSync(failurePath)) {
  out({})
  process.exit(0)
}

const content = readFileSync(failurePath, 'utf8').trim()
if (!content) {
  out({})
  process.exit(0)
}

let failure
try {
  failure = JSON.parse(content)
} catch {
  out({})
  process.exit(0)
}

if (payload.status && payload.status !== 'completed') {
  out({})
  process.exit(0)
}

writeFileSync(failurePath, '', 'utf8')

out({
  followup_message: `Harness lint failed on ${failure.file}. Fix oxlint errors, then re-run npm run lint.\n\n${failure.output}`,
})
