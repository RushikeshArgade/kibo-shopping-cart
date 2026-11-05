# Kibo Shop — Shopping Cart

[![CI](https://github.com/RushikeshArgade/kibo-shopping-cart/actions/workflows/ci.yml/badge.svg)](https://github.com/RushikeshArgade/kibo-shopping-cart/actions/workflows/ci.yml)

Shopping cart web application built for the Kibo Commerce Senior UI Engineer assessment.

**Live:** https://kibo-shopping-cart-psi.vercel.app

> Work in progress. Architecture, testing, performance, security and accessibility notes will be
> completed as each feature lands.

## Stack

React 19 · TypeScript 7 (strict) · Vite 8 · Tailwind CSS 4 · Redux Toolkit 2 + RTK Query ·
React Router 8 · Zod 4 · Vitest 5 + React Testing Library + MSW 3 · Playwright

## Getting started

Requires Node.js 24+.

```bash
npm install
npm run dev
```

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

## Project docs

- [`developer-log.md`](developer-log.md) — AI-augmentation log
- [`CLAUDE.md`](CLAUDE.md) — context and rules given to the AI assistant
- [`docs/adr-001-state-management.md`](docs/adr-001-state-management.md) — state management decision
- `docs/performance-notes.md` — _coming_
- `review/CODE_REVIEW.md` — _coming_
