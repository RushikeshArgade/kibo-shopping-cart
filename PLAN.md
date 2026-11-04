# Implementation Plan

Working one step at a time. Each step follows the same loop:

1. **Plan** — AI proposes approach + files; I approve or adjust.
2. **Build** — small vertical slice.
3. **Test** — behaviour tests; break the code once to prove a key test fails.
4. **Review** — I read the diff; anything I correct goes into the developer log with before/after.
5. **Log** — 5 minutes on `developer-log.md` while it's fresh.
6. **Commit** — AI proposes files + message; I approve.

## Progress

| Phase                           | Status         |
| ------------------------------- | -------------- |
| 0. Decisions + AI context       | ✅ Done        |
| 1. Architecture                 | 🟡 ADR pending |
| 2. Build in slices              | 🟡 In progress |
| 3. Tests (per slice + e2e)      | ⬜             |
| 4. Performance                  | ⬜             |
| 5. Security, review, docs, ship | ⬜             |

## Steps

### ✅ 0. Scaffold and decisions

Stack, state management, persistence, cart behaviour, testing approach, `CLAUDE.md`,
developer log, tooling. Commits: scaffold, LF endings, commit rules.

### ✅ 1. GitHub, CI and deploy (early, so every later push is checked)

- Repo: https://github.com/RushikeshArgade/kibo-shopping-cart (private until submission).
- GitHub Actions: typecheck, lint, format check, tests, build, then Playwright e2e — first
  run green.
- Vercel: https://kibo-shopping-cart-psi.vercel.app — `/cart` and deep paths serve the app
  (SPA rewrite verified).

### ✅ 2. Products data layer

- `shared/lib/money` — dollars → cents, format with `Intl.NumberFormat`.
- `features/products` — Zod schemas, deterministic fake inventory, RTK Query `productsApi`
  (products + categories, retry once on network/5xx only).
- Validation runs in `queryFn`, so bad data is a normal `CUSTOM_ERROR` (a throw in
  `transformResponse` is treated as an unhandled error by RTK Query).
- MSW handlers + fixtures. Tests split into Node (`*.test.ts`) and jsdom (`*.test.tsx`)
  projects: full suite ~3s instead of minutes.
- **Tests:** 49 passing, 96% coverage; money helpers 100%; break-tests run on money and
  schemas.

### ⬜ 3. Product listing UI

- Product card (image, title, price, category, rating, stock status), responsive grid.
- Loading skeleton, empty state, error state with "Try again".
- **Tests:** each state rendered from MSW responses; images have alt text.

### ⬜ 4. Filter, search, sort, pagination (URL-driven)

- Pure `filter → sort → paginate` function; hook that reads/writes URL params.
- Category select, search input, sort select, pagination controls — all keyboard accessible.
- Changing a filter resets to page 1.
- **Tests:** pure function edge cases (empty result, last page, ties in sort); URL ↔ UI sync.

### ⬜ 5. Cart state

- `cartSlice`: add, increment, decrement (1 → remove), remove, clamp to `1..stock`.
- Lines store id, quantity and snapshot. Selectors: item count, subtotal in cents.
- **Tests:** 100% on reducers/selectors — rapid adds can't exceed stock, totals in cents.

### ⬜ 6. Cart UI

- Add to Cart on cards (disabled when out of stock / at max), header badge, `/cart` page.
- `aria-live` announcements; focus moves sensibly after removing a line.
- "Page not found" route: the SPA rewrite sends every unknown URL to the app, so React Router
  must show a proper 404 page.
- **Tests:** add → badge updates; quantity controls; remove; empty cart state.

### ⬜ 7. Persistence and tab sync

- Listener middleware: save to `localStorage` with `version`; load with Zod, fall back to empty.
- `storage` event replaces the cart (last write wins); never write back storage-driven changes.
- **Tests:** reload restores cart; corrupted/old data → empty cart; no write-back loop.
- Then write **`docs/adr-001-state-management.md`** (decision is now proven in code).

### ⬜ 8. Reconcile cart with catalog

- Out of stock → disabled line, excluded from total. Stock below quantity → cap + notice.
  Missing product → "No longer available".
- **Tests:** each case, plus totals exclude unavailable lines.

### ⬜ 9. End-to-end tests

- Playwright: browse → add → change quantity → totals update (desktop + mobile).
- Error path with `page.route`. Coverage report + per-file 100% thresholds for cart and money.

### ⬜ 10. Responsive and accessibility pass

- Check 320px / tablet / desktop, keyboard-only walkthrough, contrast check, screen reader spot check.
- Record trade-offs in the README.

### ⬜ 11. Performance

- Measure: React Profiler (what re-renders on add to cart), Lighthouse, bundle analysis.
- Fix what's found; write **`docs/performance-notes.md`** with before/after evidence.

### ⬜ 12. Security

- `npm audit`, review API/persisted data handling.
- Security headers on Vercel: the live site currently sends HSTS only — add CSP,
  `X-Content-Type-Options`, `Referrer-Policy`, frame protection.
- Findings and decisions in the README.

### ⬜ 13. Code review exercise

- I pick an anti-pattern I've met in production; write the "before" component and refactor.
- **`review/CODE_REVIEW.md`** written as a PR comment to a teammate.

### ⬜ 14. Docs and final review

- README complete (versions, setup, testing, architecture, trade-offs, skipped edge case).
- Developer log complete: AI strategy, ≥3 audits, verification, disagreement — all in my words.
- Fresh clone → install → test → build works. Submit repo link + live URL.
