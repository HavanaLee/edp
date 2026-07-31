---
name: add-page
description: >-
  Use when adding a new navigable page or route to the EDP frontend. Follows
  types → mocks → api/client → page → App route → AppLayout nav order.
---

# Add a page

## Steps

1. If new fields are needed, extend `src/types/index.ts` first.
2. Add mock data in `src/mocks/data.ts` when the page needs demo data.
3. Expose read/write helpers in `src/api/client.ts` (pages must not import mocks).
4. Create `src/pages/MyPage.tsx` with a named export and `PageHeader` from `@/components/ui`.
5. Register `<Route path="..." element={<MyPage />} />` in `src/App.tsx`.
6. For sidebar pages, add `{ to, label, icon }` to `nav` in `src/components/AppLayout.tsx`.
7. Detail-only pages usually skip the sidebar entry.
8. Verify: `npm run lint && npm test && npm run build`.

## Constraints

- Reuse `@/components/ui` and CSS variables; Chinese copy; no `any`.
- Keep data flow: `pages → Query → api/client → mocks`.
