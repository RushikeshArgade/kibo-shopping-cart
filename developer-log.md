# Developer Log — AI-Augmented Development

> I used Claude Code as a pair throughout. I made the decisions; Claude drafted options, code and
> docs, and challenged my choices. This log is written as the work happens.
>
> Entries marked **[review]** are drafted from my notes and still need my final read-through.

## AI Strategy

### How I gave the AI context

- `CLAUDE.md` at the repo root holds the stack, folder structure, API schema, conventions and
  the decisions already made, so every session starts from the same constraints.
- _TODO: how prompting differed for architecture vs implementation vs tests._

### A prompt I had to iterate on

- _TODO: first prompt, what was wrong with the output, revised prompt._

## Decision log

### 2026-11-04 — Framework: React + Vite instead of Next.js **[review]**

Claude suggested Next.js. I went with Vite + React because I haven't used Next.js and didn't want
to learn a new framework under this deadline instead of focusing on what's being evaluated.
The cost is no SSR, which hurts SEO and first load for product pages. For a real storefront I
would look at an SSR framework.

### 2026-11-04 — State management: Redux Toolkit + RTK Query **[review]**

At first I thought one store was enough: fetch products, keep the cart in memory. While
discussing it I understood the two are different kinds of state: products belong to the API
(they need loading, error, caching and retry), while the cart belongs to the user (it needs
persistence and tab sync).

I got Claude to compare four options: Context + useReducer, Zustand + custom fetch, Redux
Toolkit + RTK Query, and Zustand + TanStack Query. I picked Redux Toolkit + RTK Query because we
are designing for a big team: one toolkit covers both kinds of state and gives everyone the same
conventions. I have also used it before. Claude's runner-up was Zustand + TanStack Query, but I
haven't used Zustand, so I couldn't defend it as well.

### 2026-11-04 — Persistence: localStorage + my own middleware **[review]**

Redux state lives in memory, so it's lost on refresh. I compared where to keep the cart:

- **Server cart** — not possible, it needs a backend. Discarded.
- **sessionStorage** — only one tab, and it's lost when the tab closes.
- **IndexedDB** — a browser database for large or structured data (offline apps, big caches,
  files). It's async and more complex, and it has no built-in event to tell other tabs about
  changes. Too much for a cart of a few KB.
- **localStorage** — chosen. It survives refresh, is shared across tabs, and the `storage` event
  lets other tabs know when the cart changes.

I wrote a small listener middleware instead of using redux-persist. I haven't used
redux-persist, and with my own code I control versioning and Zod validation of what's read back.

### 2026-11-04 — Other scope decisions **[review]**

- **Pagination** for the large catalog: from the spec, pagination works simply with filter and
  sort, and keeping them in the URL means views can be shared and the back button works.
  Virtualization I'll consider later only if profiling shows a need.
- **Fake inventory**: the API has no stock, so I added a fixed stock per product to be able to
  show the "can't add more than available" case.
- **Vitest + React Testing Library + Playwright**: Vitest comes naturally with Vite and works
  like Jest; Playwright for real browser end-to-end flows.

### 2026-11-04 — Cart behaviour and testing decisions **[review]**

- **Decrement at 1 removes the item** — that's the standard behaviour on most e-commerce sites.
- **Cart on its own `/cart` page** — the most common pattern. A side drawer could be added later.
- **Two tabs**: last write wins. I first thought localStorage alone keeps both tabs in sync.
  Discussing it, I learned the other tab's UI only updates when it listens to the `storage`
  event, and that the sync must not write back to storage on those changes, or the two tabs
  keep triggering each other forever.
- **Unavailable items**: Claude suggested capping quantities, removing missing products and
  showing a notice. I wanted to keep them visible instead: an out-of-stock or removed product
  stays in the cart as a disabled line, not counted in the total, with a Remove button. The user
  sees what happened instead of items disappearing. I also thought of "notify me when back in
  stock", but dropped it because it needs a backend — a button that doesn't really work is
  worse than none.
- **Honest limitation**: the fake stock never changes, so in this demo these cases only happen
  in tests.
- **MSW for API mocking**: I've usually mocked `fetch` with `vi.fn`. Here I chose MSW because
  `vi.fn` mocks answer by call order, and RTK Query's retries, caching and parallel requests
  make that brittle. MSW answers by URL, like a real server.
- **Coverage**: 80% overall, 100% for cart reducers/selectors and money helpers, because bugs
  there cost real money.
- **Not handled on purpose**: a price change between adding to cart and checkout. It needs a
  server to check the current price.

### 2026-11-05 — Product listing UI **[review]**

- **2 columns on mobile**, 3 on tablet, 4 on desktop — the common e-commerce pattern, so
  shoppers see more products at once.
- **Skeleton cards while loading**, not a spinner: the page doesn't jump when products arrive,
  and it feels faster.
- **Categories shown exactly as the API sends them** (`jewelery`, `men's clothing`). Claude
  suggested a small label map to fix the spelling and capitalisation. I went with as-is because the
  original data should be fixed, not patched in the UI. Today it's one category; if more come
  in the future, do we write a patch for each of them? Fixing the source data once is easier to
  identify and maintain — one single source of truth.
- **Headings**: the brand "Kibo Shop" is a link home, not the `<h1>`; each page has its own `<h1>`
  ("Products"), so screen-reader users jumping by heading land on the page content.
- **No description on the card** and **no product detail page** — the brief doesn't ask for them,
  so they're future improvements, not scope.

### 2026-11-05 — Overriding a lint rule, on one line only **[review]**

The linter (`jsx-a11y/prefer-tag-over-role`) wanted `<output>` instead of `<p role="status">` for
the hidden "Loading products" message. I kept `role="status"`: `<output>` is meant for the result
of a calculation or user action, and its support as a live region has been less consistent than
an explicit `role="status"`. I disabled the rule for that one line only, with the reason in a
comment next to it, instead of turning it off for the whole project — so the linter still checks
everywhere else.

### 2026-11-05 — Filter, search, sort and pagination **[review]**

- **12 products per page**: divides evenly by 2, 3 and 4 columns, so rows are always full.
- **Default sort "Featured"** (the API's order), like most stores.
- **Category as a native `<select>`**, not chips: accessible out of the box and still works with
  50 categories, which fits the "designed for scale" reason behind the categories endpoint.
- **Live search** as you type; bad URL values fall back to defaults so old links still work.
- **Back button**: Claude noticed in the browser that the first search keystroke replaces the
  history entry before it, so one Back undoes both the search and the category change before
  it. It suggested a refinement (first keystroke adds an entry). I kept it as designed because
  _TODO: my reason_.

## Human Audit (≥3, at least one structural)

| #   | Area                         | What the AI produced                             | What I changed and why                                                                                                                                           |
| --- | ---------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | AI context file (structural) | First `CLAUDE.md` draft, reviewed against the JD | Asked for a re-review against the assessment brief. Added responsive rules, contrast, e2e flow, coverage threshold, audit, CI, deploy; fixed a performance rule. |
| 2   |                              |                                                  |                                                                                                                                                                  |
| 3   |                              |                                                  |                                                                                                                                                                  |

_Before/after snippets go under each entry._

### 1. CLAUDE.md re-reviewed against the assessment **[review]**

Claude wrote the first `CLAUDE.md` and its first review was based on the job description. I
noticed that and asked for a second review against the assessment brief instead, because the
brief is what I'm being graded on. That pass showed real gaps: nothing about responsive design,
no colour contrast, no named e2e flow, no coverage threshold, no dependency audit, CI or deploy,
and a performance rule that went against the brief. I checked each point against the brief
myself before approving the changes.

The structural one, before:

```md
- **Re-renders**: components subscribe to the smallest slice they need with memoized
  selectors (`createSelector`). Product cards must not re-render when an unrelated cart line changes.
```

After:

```md
- Write clear, idiomatic code. Do not pre-optimize with blanket `memo`/`useMemo`.
- Before optimizing, **measure** (React Profiler, Lighthouse, bundle analysis) and record what
  was found, how, what changed and before/after evidence in `docs/performance-notes.md`.
```

Why: the brief asks me to find and fix a real performance issue in my own code and says not to
assume there isn't one. A rule that makes the AI optimize everything upfront skips the measuring
and turns performance into an assumption.

## Verification — AI-generated tests

My rule in `CLAUDE.md`: a test only counts if it fails when the behaviour it covers is broken.
So after Claude writes tests, the code gets broken on purpose to see if they catch it.

### Money helpers — the check exposed a useless test

Claude's first tests for `toCents` used `9.85` as the "floating-point drift" example. Running
the check (swap `Math.round` for `Math.floor`), all 15 tests still passed — the tests didn't
catch the exact bug they were written for. In Node, `9.85 * 100` is exactly `985`, so the
example never drifted. The values that really drift are like `19.99 * 100 = 1998.9999…`.

Before:

```ts
[9.85, 985], // 9.85 * 100 = 984.9999… in floating point
```

After:

```ts
// These multiply to just below the whole cent (19.99 * 100 = 1998.9999…),
// so truncating instead of rounding would lose a cent.
it.each([
  [19.99, 1999],
  [4.35, 435],
  [1.15, 115],
  [0.29, 29],
])('rounds %d dollars up to %d cents despite float drift', ...)
```

With the fix, the same break makes 4 tests fail. Claude ran this check, following my rule; the
lesson for me: 100% coverage meant nothing here — the test passed for the wrong reason.

### Product schemas — I ran the check myself

I made two breaks in `schemas.ts`:

1. Removed the HTTPS rule (`z.url({ protocol: /^https$/ })` → `z.url()`) → the `http image` and
   `javascript: image` tests failed. ✅
2. Replaced `continue` with `throw` (fail the whole list on one bad product) → the "drops an
   invalid product, keeps the rest" test failed. ✅

3 tests failed in total, exactly the ones covering those behaviours. "Throws when every product
is invalid" still passed with break 2 — correct, since it checks a different behaviour. Each
test targets one behaviour, so a break only fails the tests about that behaviour.

## A Disagreement

- _TODO: pick the strongest one. Candidates so far: Next.js vs Vite + React; keeping unavailable
  items visible instead of removing them; categories shown as-is instead of a label map._
