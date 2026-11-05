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

### ✅ 3. Product listing UI

- Product card (image, title, price, category, rating, stock status); grid 2/3/4 columns.
- Loading skeleton, empty state, error state with "Try again".
- Brand is a link home; each page owns its `<h1>`. Categories shown as the API sends them.
- Checked in the browser at 320px (no horizontal scroll), 375px, 768px and 1280px.
- **Tests:** 61 passing; each state rendered from MSW responses; images have alt text.

### ✅ 4. Filter, search, sort, pagination (URL-driven)

- Pure `queryCatalog` (filter → stable sort → paginate, 12 per page); `useCatalogParams` reads
  and writes the URL, bad values fall back to defaults, defaults are left out of the URL.
- Search, category `<select>`, sort `<select>` inside a `<search>` landmark; pagination as
  real links with `aria-current`; focus moves to the results summary after paging.
- `BrowserRouter useTransitions={false}`: fixes the search cursor jumping to the end while
  typing (found in the browser, not by jsdom tests).
- Back button: search keystrokes replace the current history entry, so Back undoes a search
  together with the change before it — kept as designed.
- **Tests:** 97 passing; catalog logic 100%; deep links, URL sync, page reset, focus.

### ✅ 5. Cart state

- `cartSlice` (`createEntityAdapter`): add, increment, decrement (1 → remove), remove, clear;
  every change clamped to stock. Adding a product already in the cart refreshes its snapshot.
- Lines store id, quantity and snapshot (title, image, price, stock). Selectors: lines, item
  count, subtotal in cents, quantity by id.
- Per-file 100% coverage thresholds for cart and money files — verified to fail when coverage drops.
- **Tests:** 18 cart tests at 100%; 115 overall.

### ✅ 6. Cart UI

- Add to cart on cards ("N in cart" / "Max N in cart"), header link "Cart (3)", `/cart` page
  with `− n +` stepper (fieldset + legend), line totals, Remove, subtotal, empty state.
- One shared `aria-live` announcer; buttons use explicit `aria-label`s (Chrome adds a stray
  space before ":" when names come from hidden spans).
- Focus after removing a line: next line → previous line → "Your cart" heading.
- 404 page for unknown URLs; per-page titles via React 19 `<title>`.
- Native `disabled` at the stock limit, kept simple. Known trade-off: a focused button that
  disables itself drops keyboard focus to `<body>` — to document in the README (step 10).
- **Tests:** 138 unit + 2 e2e; focus-after-removal tests proven by a break-test.

### ✅ 7. Persistence and tab sync

- Listener middleware saves `{ version: 1, lines }` to `localStorage`; loaded and validated with
  Zod before the first render; blocked or full storage never crashes.
- `storage` event replaces the cart (last write wins); `replaceCart` is never saved (no loop).
- **Tests:** 155 unit + 6 e2e — reload keeps the cart and a second tab sees changes (real
  browser); break-tests proved the no-loop and reload tests fail when broken.
- **`docs/adr-001-state-management.md`** written.

### ✅ 8. Reconcile cart with catalog

- On the cart page: out of stock → greyed line, "Out of stock", excluded from subtotal;
  missing → "No longer available"; quantity above stock → capped (and saved) with a note.
- The app layer passes products into `CartPage`, so cart code never imports product code at
  runtime (no circular dependency). Verified in the browser with a planted old saved cart.
- **Tests:** 166 unit; 100% on cart files (the threshold caught two untested branches).

### ✅ 9. End-to-end tests

- Playwright (desktop + mobile): main journey browse → filter → add → +/− → totals; API error
  → Try again; reload keeps the cart; two tabs sync; editing a search mid-word.
- API mocked with the unit-test fixtures (`e2e/helpers.ts`) — no dependency on fakestoreapi.
- Break-tests: totals bug → journey fails; router transitions back on → search box ends up
  as "Y". CI now runs `npm run coverage` (thresholds enforced) and uploads the HTML report.
- README "Testing" section: tools, threshold and why, the deliberately unhandled edge case.

### ⬜ 10. Responsive and accessibility pass

- Check 320px / tablet / desktop, keyboard-only walkthrough, contrast check, screen reader spot check.
- Record trade-offs in the README.

### ⬜ 11. Performance

- Measure: React Profiler (what re-renders on add to cart), Lighthouse, bundle analysis.
- Known starting point: JS bundle grew from 264 KB (84 KB gzip) at scaffold to 431 KB
  (135 KB gzip) after step 4 — mostly RTK Query and Zod.
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
