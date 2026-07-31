---
name: wire-api
description: >-
  Use when connecting the EDP frontend to a real HTTP backend or changing
  api/client.ts from mocks to fetch. Keep pages unchanged where possible.
---

# Wire a real API

## Steps

1. Copy `.env.example` to `.env` and set `VITE_API_BASE` (e.g. `http://127.0.0.1:8000`).
2. Edit only `src/api/client.ts` functions to `fetch` against `${import.meta.env.VITE_API_BASE}/...`.
3. Keep return types aligned with `src/types/index.ts`; narrow JSON with typed guards — never `any`.
4. Preserve function names used by pages (`getSummary`, `reviewQcPackage`, etc.) so pages need no churn.
5. Leave mocks in place until the backend is stable; switch one endpoint at a time if unsure.
6. Verify: `npm run lint && npm test && npm run build`.

## Constraints

- Pages still call `@/api/client` only.
- Do not treat docs example paths as a locked contract until the backend owns them.
