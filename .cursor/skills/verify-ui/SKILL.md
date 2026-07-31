---
name: verify-ui
description: >-
  Use when verifying EDP UI after frontend changes. Start or reuse the Vite
  dev server and walk key routes with the Cursor Browser MCP.
---

# Verify UI

## Steps

1. Ensure `npm run dev` is running at `http://localhost:5173` (start it if needed).
2. Use Browser MCP: navigate, `browser_snapshot` (prefer over screenshot for actions).
3. Smoke-check routes relevant to the change, typically:
   - `/` dashboard
   - `/collection`, `/data`, `/pipeline`, `/qc`
   - any new route just added
4. For interactive flows (QC pass/reject, job retry), perform one happy-path click and confirm UI updates.
5. Report broken layout, missing nav, or console-visible failures; fix if caused by this change.

## Constraints

- Prefer Browser MCP over installing Playwright MCP.
- Keep the session short; one feature per verify pass.
