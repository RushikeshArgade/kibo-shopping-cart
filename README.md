# Kibo Shop — Shopping Cart

[![CI](https://github.com/RushikeshArgade/kibo-shopping-cart/actions/workflows/ci.yml/badge.svg)](https://github.com/RushikeshArgade/kibo-shopping-cart/actions/workflows/ci.yml)

Shopping cart web application built for the Kibo Commerce Senior UI Engineer assessment.

**Live:** https://kibo-shopping-cart-psi.vercel.app

## Features

- **Product listing** from [fakestoreapi.com](https://fakestoreapi.com/products): image, title,
  price, category, rating and stock status; loading skeletons, empty state, and an error state with
  "Try again".
- **Search, category filter, sort** (price, rating, name) and **pagination** — all kept in the URL,
  so views can be shared and the Back button works.
- **Cart:** add, increase, decrease and remove; quantities never exceed stock (the API has no stock,
  so a deterministic fake inventory is added); live header count; subtotal in exact cents.
- **Persists across reloads** (`localStorage`) and **stays in sync across tabs**.
- **Stale carts are reconciled** with the latest catalog: out-of-stock and discontinued products
  are shown greyed out and left out of the subtotal; quantities above current stock are lowered.
- Responsive from 320px up, keyboard and screen-reader friendly, CSP and security headers.

## Stack and versions

| Area                   | Library                                  | Version              |
| ---------------------- | ---------------------------------------- | -------------------- |
| UI                     | React, React DOM                         | 19.3.1               |
| Language               | TypeScript (strict)                      | 7.0.2                |
| Build                  | Vite                                     | 8.3.5                |
| Styling                | Tailwind CSS                             | 4.3.4                |
| State and data         | Redux Toolkit (+ RTK Query), React Redux | 2.14.0, 9.3.1        |
| Routing                | React Router                             | 8.5.1                |
| Validation             | Zod (`zod/mini`)                         | 4.6.7                |
| Unit / component tests | Vitest, React Testing Library, MSW       | 5.1.0, 16.3.3, 3.0.3 |
| End-to-end tests       | Playwright                               | 1.64.1               |
| Lint / format          | oxlint, Prettier                         | 1.91.0, 3.9.10       |

Runtime: Node.js 24 (tested with 24.22.1). Exact versions are pinned in `package-lock.json`.

## Getting started

Requires Node.js 24+.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Architecture

```
src/
  app/          store, typed hooks, App shell, routes (connects the features)
  features/
    products/   RTK Query API + Zod schemas, fake inventory, catalog logic, listing UI
    cart/       cart slice + selectors, persistence and tab sync, reconciliation, cart UI
  shared/
    lib/        money helpers (integer cents)
    ui/         Button, Pagination, QuantityStepper, StarRating, Announcer, PageTitle
  test/         test setup, render helper, MSW server, fixtures
e2e/            Playwright specs
docs/           ADR and performance notes
review/         code review exercise
```

- **Three kinds of state, each in the place that fits it** (see the
  [ADR](docs/adr-001-state-management.md)):
  - **Server data** (products, categories) — RTK Query, validated with Zod in a `queryFn`, retried
    once on network errors and 5xx.
  - **Client data** (cart) — a Redux slice; every action clamps quantity to stock; saved to
    `localStorage` by a listener middleware and synced across tabs.
  - **View state** (search, category, sort, page) — the URL.
- **Feature boundaries:** each feature exposes a public `index.ts`. The cart only imports the
  `Product` _type_ from products; the app layer passes product data into the cart page, so there's
  no runtime dependency cycle between features.
- **Money** is integer cents everywhere; dollars only appear at the API boundary and on screen.

## Scripts

| Command                | What it does                           |
| ---------------------- | -------------------------------------- |
| `npm run dev`          | Start the dev server                   |
| `npm run build`        | Typecheck and build for production     |
| `npm run typecheck`    | TypeScript project check               |
| `npm run lint`         | oxlint (React, a11y, TypeScript rules) |
| `npm test`             | Unit and integration tests (Vitest)    |
| `npm run coverage`     | Tests with coverage report             |
| `npm run e2e`          | End-to-end tests (Playwright)          |
| `npm run format:check` | Prettier check                         |

Before the first e2e run, install the browser once: `npx playwright install chromium`.

## Testing

| Level                   | Tool                                         | What it covers                                                                                                                          |
| ----------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Unit                    | Vitest (Node)                                | Money helpers, Zod schemas, fake inventory, catalog filter/sort/paginate, cart reducers and selectors, persistence, cart reconciliation |
| Component / integration | Vitest + React Testing Library (jsdom) + MSW | Listing states, filters and URL sync, Add to cart, cart page, focus handling, announcements, routing                                    |
| End-to-end              | Playwright (desktop + mobile Chromium)       | Browse → add → change quantity → totals; error + Try again; reload keeps the cart; two tabs stay in sync; editing a search mid-word     |

- **Why these tools:** Vitest runs natively with Vite and has a Jest-compatible API. React Testing
  Library tests what users see (roles, labels, text). MSW mocks the network rather than `fetch`, so
  RTK Query's caching and retries run as in production. Playwright covers what jsdom can't: a real
  browser, reloads, multiple tabs, real typing.
- **Coverage threshold:** 80% overall, **100% for cart logic and money helpers** — bugs there cost
  money, while chasing 100% on presentational markup mostly measures how many tests were written.
  `npm run coverage` enforces it locally and in CI; the HTML report is uploaded as a CI artifact.
- **Tests must fail when the code is broken.** Key tests were checked by breaking the code on
  purpose (see `developer-log.md`). Tests that couldn't fail were removed — for example, keyboard
  focus loss on a disabled button isn't reproduced by jsdom or headless Chromium, so it's verified
  manually instead.
- **Deliberately not handled:** a price change between adding to cart and checkout. It needs a
  server to confirm the current price; the cart shows the price from when the item was added.

## Responsive design and accessibility

**Responsive:** mobile-first; 2 product columns on phones (the common e-commerce pattern), 3 on
tablet, 4 on desktop; 12 products per page so every row is full. Checked at 320px, 375px, 768px
and 1280px on every page — no horizontal scrolling. Touch targets are at least 44×44px.

**Choices and why:**

- **Semantic HTML first:** `header`, `nav`, `main`, one `<h1>` per page, a `<search>` landmark,
  lists for the grid and cart, a `<fieldset>` + `<legend>` for each quantity stepper, real links
  for pagination (`aria-current="page"`). ARIA only where HTML can't express it.
- **Keyboard:** skip link to the main content; logical tab order; visible focus rings on every
  control (`focus-visible`). After paging, focus moves to the results summary; after removing a
  cart line, focus moves to the next line, the previous one, or the "Your cart" heading.
- **Screen readers:** one shared polite live region announces cart changes ("Added … 3 items in
  cart."); the results summary is a live region; buttons name their product ("Add to cart:
  Backpack", "Remove Backpack") with explicit `aria-label`s, because Chrome adds a stray space
  before punctuation when a name comes from a visually hidden span. Per-page `<title>`s.
- **Colour contrast:** all text measured against its background in the browser — every pair
  meets WCAG AA; the lowest is the green "In stock" at 4.95:1. Stock status is always written
  out, never shown by colour alone.

**Trade-offs made under time pressure:**

- **Buttons at the stock limit use native `disabled`.** If you press "Add to cart" (or `+`) until
  the limit while using the keyboard, the button disables itself and keyboard focus drops to the
  top of the page. Keeping the button focusable with `aria-disabled` fixes this but adds
  complexity; I chose the simple version and documented it. It's also not something the test
  tools catch (jsdom and headless Chromium don't reproduce it), so it was checked by hand.
- **Category names are shown exactly as the API sends them** (`jewelery`, lowercase): the data
  should be fixed at the source, not patched in the UI.
- **No automated accessibility scanner** (such as axe) in CI yet — contrast and keyboard order were
  checked manually in the browser.

## Security

The app has no backend and no user accounts, so the risks are untrusted data and the page itself.

- **API data is untrusted.** Every product and the category list are validated with Zod before
  they reach the store; a malformed product is dropped instead of breaking the page. Image URLs
  must be `https:` — `http:`, `javascript:` and `data:` URLs are rejected.
- **Saved cart is untrusted too.** What's read back from `localStorage` is validated the same way
  (with a version number); anything invalid gives an empty cart. Nothing sensitive is stored —
  only product ids, quantities and display data.
- **No HTML injection.** All text is rendered by React as text; `dangerouslySetInnerHTML` is
  banned by a lint rule.
- **Security headers** (`vercel.json`): a Content Security Policy that only allows the app's own
  scripts and styles and the API's host for data and images, blocks plugins, base-tag and form
  hijacking, and framing (`frame-ancestors 'none'` and `X-Frame-Options: DENY` against
  clickjacking); plus `X-Content-Type-Options: nosniff`, `Referrer-Policy` and a
  `Permissions-Policy` that turns off camera, microphone, geolocation and payment. HSTS comes from
  Vercel. The policy was tested locally on the production build with the same headers: the app
  worked and the browser reported no violations.
- **Dependencies:** `npm audit` reports 0 vulnerabilities (all and production-only). The
  lockfile is committed and CI installs with `npm ci`.
- **CI:** the GitHub Actions workflow has read-only permissions (`contents: read`).
- **Not done:** no automated dependency updates (e.g. Dependabot) and no Subresource Integrity —
  all scripts are served from the app's own origin, so SRI adds little here.

## Performance

Measured before changing anything — details and numbers in
[`docs/performance-notes.md`](docs/performance-notes.md):

- **Bundle:** Zod was ~19% of the JavaScript; switching to `zod/mini` cut the bundle from 139 KB
  to 125 KB gzipped (−10%) with identical validation (all tests unchanged).
- **Re-renders:** adding to the cart re-renders only the clicked button and the header badge —
  none of the other product cards.
- **Loading:** LCP is dominated by the API's 1500px PNG images (~2.7 MB per page). Priority hints
  and preconnect were measured and gave no improvement, so they were removed; the real fix is
  resized WebP/AVIF images from an image CDN, which isn't possible with a third-party API.

## Trade-offs and future improvements

- **Single-page app (no SSR):** I chose Vite + React over Next.js. For a real storefront, server
  rendering would help SEO and first load.
- **Fake inventory:** stock is derived from the product id, so "stock changed" only happens in
  tests or with an old saved cart. A real store would check stock on the server.
- **Cart is per browser:** signed-in users would need a server-side cart; tabs use "last write
  wins" rather than merging simultaneous edits.
- **Not built:** checkout, product detail page, "notify me when back in stock" (needs a backend),
  automated accessibility scanning in CI, resized images.

## AI-assisted development

Built with Claude Code as a pair: I made the decisions; the AI drafted options, code and docs,
which I reviewed, tested and corrected. How I directed and checked it is in
[`developer-log.md`](developer-log.md); the rules I gave it are in [`CLAUDE.md`](CLAUDE.md).

## Project docs

- [`developer-log.md`](developer-log.md) — AI-augmentation log
- [`CLAUDE.md`](CLAUDE.md) — context and rules given to the AI assistant
- [`docs/adr-001-state-management.md`](docs/adr-001-state-management.md) — state management decision
- [`docs/performance-notes.md`](docs/performance-notes.md) — what was measured, found and changed
- [`review/CODE_REVIEW.md`](review/CODE_REVIEW.md) — code review exercise (fetching in `useEffect` without cleanup)
