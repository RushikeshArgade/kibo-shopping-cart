# ADR-001: State management

- **Status:** Accepted
- **Date:** 2026-11-05
- **Deciders:** Rushikesh Argade (with Claude Code as a sparring partner — see `developer-log.md`)

> **[review]** Drafted from my decision log. Read and adjust before submission.

## Context

The app has two kinds of state, and they behave differently:

|              | Products (server state)                    | Cart (client state)                                  |
| ------------ | ------------------------------------------ | ---------------------------------------------------- |
| Owned by     | The API                                    | The user                                             |
| Can go stale | Yes — the server can change it             | No — it's the source of truth                        |
| Needs        | Loading, error, caching, retry, cancelling | Persistence across reloads, tab sync, quantity rules |

At first I thought one store would be enough: fetch products, keep the cart in memory. Working
through it, I saw that treating products like the cart means hand-writing loading, error, caching
and retry logic, and that the brief asks for a structure that scales to a larger team and catalog.

A third kind of state — **filter, search, sort and page** — belongs in neither: it's part of what
the user is looking at, so it lives in the **URL**.

## Options considered

### 1. Context + `useReducer`

- **For:** no dependencies; plain React.
- **Against:** every component reading the context re-renders on any cart change; products would
  need a hand-written fetch hook (loading, error, retry, caching, race conditions); no shared
  conventions for a growing team.

### 2. Zustand + a hand-written fetch hook

- **For:** tiny, little boilerplate, selectors limit re-renders, built-in persistence.
- **Against:** data fetching is still hand-written; loose structure as more developers join; I
  haven't used Zustand.

### 3. Redux Toolkit + RTK Query — **chosen**

- **For:** one toolkit for both kinds of state — RTK Query for products, a slice for the cart;
  standard structure (slices, actions, selectors) a team can follow; memoized selectors control
  re-renders; reducers are pure functions and easy to test; Redux DevTools; I've used it before.
- **Against:** more boilerplate and a bigger bundle than Zustand.

### 4. Zustand + TanStack Query

- **For:** best tool for each job, and lighter than option 3.
- **Against:** two libraries and two mental models to defend; Zustand stays loose on structure.
  This was Claude's runner-up; I picked option 3 because I can defend it from experience and
  it gives one set of conventions.

## Decision

**Redux Toolkit + RTK Query**, with each kind of state in the place that fits it:

- **Products and categories** — RTK Query (`productsApi`). Responses are validated with Zod inside
  a `queryFn`, so bad data becomes a normal API error rather than a crash. Retry once, only on
  network errors and 5xx.
- **Cart** — a slice built with `createEntityAdapter` (lines by product id, in the order added).
  Every action clamps quantity to stock, so rapid clicks can't overshoot; totals are integer cents.
- **Filter / search / sort / page** — the URL, read and written by `useCatalogParams`. Views can be
  shared and the Back button works. Not duplicated in Redux.

### Persistence

- **Where:** `localStorage` — it survives reloads and is shared across tabs. A server cart needs a
  backend (out of scope); `sessionStorage` is per-tab and lost when the tab closes; IndexedDB is
  async, more complex, and has no built-in change event for other tabs.
- **How:** a small RTK listener middleware instead of redux-persist (which I haven't used). The
  saved cart has a `version` and is validated with Zod on load — missing, corrupted or old data
  gives an empty cart instead of a crash. It's read synchronously before the first render, so the
  cart never flashes empty.
- **Tabs:** the browser's `storage` event replaces this tab's cart with the other tab's (last write
  wins). Changes that came from another tab are **not** saved again, otherwise two tabs would keep
  triggering each other.

## Consequences

**Positive**

- One way to handle server data (loading, error, retry) and one way to handle client data.
- The cart logic is pure and fully covered (100% threshold on cart and money files).
- Clear boundaries: features expose a public `index.ts`; URL state stays out of Redux.

**Negative / accepted**

- More code than a minimal Zustand setup.
- Bundle cost: Redux Toolkit (with RTK Query) measured at 32 KB gzipped — about a quarter of
  the JS after the Zod fix (125 KB gzipped total). See `docs/performance-notes.md`.
- `localStorage` is per-browser: the cart doesn't follow the user to another device. A real store
  would use a server-side cart for signed-in users.
- Last write wins across tabs: simultaneous edits in two tabs aren't merged.

## Revisit when

- Products are paginated on the server — `queryCatalog` moves behind the API.
- Users sign in — move the cart to the server and keep `localStorage` for guests only.
