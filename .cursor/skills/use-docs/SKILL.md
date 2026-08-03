---
name: use-docs
description: >-
  Use when looking up React Router, TanStack Query, Vite, Tailwind, or other
  library APIs. Fetch docs via Context7 instead of pasting long docs into rules.
---

# Use library docs (Context7)

## Steps

1. Resolve the library id with Context7 (`resolve-library-id`).
2. Query only the specific API or topic needed (`query-docs`).
3. Apply the minimal snippet to the change; do not dump whole pages into chat or rules.
4. Prefer project versions from `package.json` when Context7 supports version pinning.

## Constraints

- Do not copy large documentation into always-on rules.
- Do not invent APIs from memory when Context7 can answer.
