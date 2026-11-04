# Kibo Shop — Shopping Cart

Shopping cart web application built for the Kibo Commerce Senior UI Engineer assessment.

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

## Project docs

- [`developer-log.md`](developer-log.md) — AI-augmentation log
- [`CLAUDE.md`](CLAUDE.md) — context and rules given to the AI assistant
- `docs/adr-001-state-management.md` — _coming_
- `docs/performance-notes.md` — _coming_
- `review/CODE_REVIEW.md` — _coming_
