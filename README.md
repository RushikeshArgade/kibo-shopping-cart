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

## Project docs

- [`developer-log.md`](developer-log.md) — AI-augmentation log
- [`CLAUDE.md`](CLAUDE.md) — context and rules given to the AI assistant
- [`docs/adr-001-state-management.md`](docs/adr-001-state-management.md) — state management decision
- `docs/performance-notes.md` — _coming_
- `review/CODE_REVIEW.md` — _coming_
