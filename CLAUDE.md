# Project context for AI assistants

Shopping cart web app for the Kibo Commerce Senior UI Engineer assessment.
Graded on architecture, edge-case handling, responsiveness, accessibility, testing strategy,
performance, security, and how AI output is reviewed. Treat every change as production code.

## Stack (decided — do not change without asking)

- Vite + React 19 + TypeScript (strict, `noUncheckedIndexedAccess`)
- Tailwind CSS v4 (utility classes only; no CSS-in-JS, no new CSS files without asking)
- Redux Toolkit: **RTK Query** for server state (products), **slices** for client state (cart)
- React Router — filter, sort, search and page live in the **URL search params**, not in Redux
- Zod — validate every API response and everything read back from `localStorage`
- Vitest + React Testing Library + MSW (unit/integration), Playwright (end-to-end)
- Lint: oxlint (react, jsx-a11y, typescript, vitest plugins). Format: Prettier.
- Deploy: Vercel (SPA rewrite so client routes work on refresh). CI: GitHub Actions.

Do not add dependencies without asking first and stating why.

## Folder structure (feature-first)

```
src/
  app/            store, typed hooks, App shell, routes
  features/
    products/     productsApi (RTK Query), schemas, inventory, listing UI, filters
    cart/         cartSlice, selectors, persistence/sync middleware, cart page
  shared/
    ui/           reusable presentational components (Button, Spinner, ...)
    lib/          pure helpers (money, formatting)
  test/           test setup, render helper, MSW server and handlers
e2e/              Playwright specs
docs/             adr-001-state-management.md, performance-notes.md
review/           CODE_REVIEW.md + the refactored component
```

A feature exposes its public API through its own `index.ts`. Other features import from that
file only, never from deep paths inside another feature.

## Data source

- `GET https://fakestoreapi.com/products` returns an array of:

  ```ts
  {
    id: number
    title: string
    price: number // dollars, float
    description: string
    category: string
    image: string // absolute URL
    rating: {
      rate: number
      count: number
    }
  }
  ```

- `GET https://fakestoreapi.com/products/categories` returns `string[]`.
- The API has no stock and no real pagination. Treat every response as untrusted input.
- Network errors: retry once, then show an error state with a "Try again" action. Never a blank screen.

## Product listing

- Each card shows image, title, price, category and rating, plus stock status.
- Images: `alt` = product title, `loading="lazy"`, explicit width/height (no layout shift).
  Long titles are clamped visually to 2 lines but stay fully available to screen readers.
- Category filter (from the categories endpoint), text search on title, sort by
  price (low→high, high→low), rating (high→low) and name (A→Z).
- Pagination; page, category, search and sort are URL params, so views are shareable and the
  back button works. Changing a filter resets to page 1. Virtualization is a later option only.
- Loading, empty ("no products match") and error states.

## Cart

- Lives on its own `/cart` page. A header badge shows the item count.
- Badge, cart page and summary all read from the **same selectors**, so they update together.
- A line stores `id`, `quantity` and a **snapshot** (title, image, price) so it can still be
  shown if the product disappears from the catalog.
- Quantity: increment, decrement, remove. **Decrementing from 1 removes the line.**
  Quantity can never exceed stock.
- **Rapid clicks**: reducers are synchronous and clamp quantity to `1..stock` on every action,
  so any number of fast clicks can never overshoot.
- **Money**: store and calculate in integer cents; format only at the edge with
  `Intl.NumberFormat` (USD).
- **Inventory**: the API has no stock, so a deterministic fake stock per product id is added in
  the products mapping layer (some items low, at least one out of stock). Real enforcement
  would be server-side.
- **Reconciling against the catalog** (when products load):
  - out of stock → line is shown disabled, labelled "Out of stock", excluded from the total, with Remove
  - stock below quantity → quantity reduced to stock, with a notice ("Only 3 left — quantity updated")
  - product no longer in catalog → "No longer available", excluded from the total, with Remove
  - Changes are announced through a polite `aria-live` region.
  - "Notify me when back in stock" is out of scope (needs a backend); mention it as future work.

## Persistence and tab sync

- Hand-written RTK listener middleware (not redux-persist).
- Redux is the source of truth inside a tab; `localStorage` is the shared channel between tabs.
- Saved cart has a schema `version`. Read it back with Zod; if invalid or a different version,
  fall back to an empty cart.
- Other tabs: listen to the `storage` event and replace the cart (last write wins).
- **Never write to storage in response to a change that came from storage** (avoids a
  ping-pong loop between tabs).

## Responsive design

- Mobile-first. Tailwind defaults: base = mobile, `md` = tablet, `lg` = desktop.
- No horizontal scrolling at 320px wide. Touch targets at least 44×44px.
- The product grid, filters and cart layout must each work at all three sizes.

## Accessibility

- Semantic HTML first (`header`, `nav`, `main`, `button`, lists, headings in order).
  ARIA only where semantics can't express it.
- Every interactive element works from the keyboard and has an accessible name.
  Icon-only buttons need a label that names the product (e.g. "Remove Backpack from cart").
- Visible focus styles. Move focus sensibly after removing a cart line.
- Colour contrast meets WCAG AA (4.5:1 text, 3:1 large text and UI parts).
- Announce cart changes politely through an `aria-live` region.
- Record any accessibility trade-off made under time pressure in the README.

## Performance

- Write clear, idiomatic code. Do not pre-optimize with blanket `memo`/`useMemo`.
- Before optimizing, **measure** (React Profiler, Lighthouse, bundle analysis) and record what
  was found, how, what changed and before/after evidence in `docs/performance-notes.md`.

## Security

- Never use `dangerouslySetInnerHTML`. Render API strings as text only.
- Validate API data and persisted data with Zod before it enters the store.
- Run `npm audit`; record findings and what was done (or why not) in the README.

## Code conventions

- Function components, named exports. No default exports except where a tool requires them.
- No `any`. No non-null `!` except at the React root mount.
- Reducers stay pure. Side effects (storage, sync) live in listener middleware.

## Testing

- Test behaviour the user can see (roles, labels, text), not implementation details.
- Use `renderWithProviders` from `src/test/render.tsx` for component tests.
- Mock the network with MSW handlers, not by stubbing `fetch`. Override per test for errors,
  empty results and malformed data. Unhandled requests fail the test.
- Cover: product fetching (success, empty, error, malformed), cart reducers and selectors,
  quantity limits, totals in cents, reconciliation, persistence and tab sync.
- Playwright: at least the flow browse → add to cart → change quantity → totals update,
  on desktop and mobile viewports. Use `page.route` for error-path e2e tests.
- Coverage threshold: 80% overall, 100% for cart reducers/selectors and money helpers
  (bugs there cost money). Presentational markup is not chased to 100%.
- A test is only accepted if it fails when the behaviour it covers is broken.
- Deliberately not handled: a price change between adding to cart and checkout (needs a server).
  Document it, don't build it.

## Required deliverables

- `README.md` — versions, setup/run, testing, architecture overview, trade-offs, audit results
- `developer-log.md` — AI strategy, human audit, verification, a disagreement (written by me)
- `docs/adr-001-state-management.md`, `docs/performance-notes.md`, `review/CODE_REVIEW.md`
- GitHub Actions running typecheck, lint and tests on push; live Vercel deployment

## Working agreement

- Propose a plan and the files you will touch before writing non-trivial code.
- Keep changes small: one vertical slice per change.
- **State your assumptions and trade-offs explicitly** in each response so they can be reviewed.
- **Verify claims by running them, not from memory.** Numeric facts (e.g. a floating-point
  result), library APIs and options, and browser behaviour must be checked — in Node, in the
  installed package's types/source, or in the browser — before they go into code, comments or tests.
- Run `npm run typecheck && npm run lint && npm test` before calling work done.
- **Never commit without asking.** Before every commit, list the files and the exact commit
  message, and wait for my approval. Approval for one commit does not cover the next.

## Commit messages

Conventional Commits, kept short:

```
<type>(<optional scope>): <short description>

[optional body]

[optional footer(s)]
```

- Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `build`, `ci`, `chore`.
- Scopes: `products`, `cart`, `app`, `ui`, `test`, `e2e`, `ci`, `deps`, `docs`.
- Subject: imperative, lowercase, no period, **≤ 50 characters** (hard limit 72).
- Body only when the "why" isn't obvious: at most 3 short lines, wrapped at 72.
- Footer: `Co-Authored-By` line for AI-assisted commits.
