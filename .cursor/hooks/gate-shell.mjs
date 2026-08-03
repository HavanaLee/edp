import { readFileSync } from 'node:fs'

function readStdin() {
  return readFileSync(0, 'utf8')
}

function out(obj) {
  process.stdout.write(JSON.stringify(obj))
}

const raw = readStdin()
let payload = {}
try {
  payload = JSON.parse(raw || '{}')
} catch {
  out({ permission: 'allow' })
  process.exit(0)
}

const command = String(payload.command ?? '')
const normalized = command.replace(/\s+/g, ' ').trim()

const denyPatterns = [
  /\bgit\s+push\s+.*--force\b/i,
  /\bgit\s+push\s+-f\b/i,
  /\bgit\s+config\b/i,
  /\bgit\s+reset\s+--hard\b/i,
  /\bgit\s+clean\s+-f/i,
  /\brm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+.*\/|[^\n]*\/\s*$)/i,
  /\bRemove-Item\b.*-Recurse\b.*-Force\b/i,
  /\bdel\s+\/s\b/i,
  /\bformat\s+[A-Za-z]:/i,
]

for (const re of denyPatterns) {
  if (re.test(normalized)) {
    out({
      permission: 'deny',
      user_message: 'Blocked by project harness: destructive or git-config command.',
      agent_message:
        'This shell command is blocked by .cursor/hooks/gate-shell.mjs. Use a safer alternative; never force-push, change git config, or wipe directories.',
    })
    process.exit(0)
  }
}

out({ permission: 'allow' })
