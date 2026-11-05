# Performance notes

> **[review]** Drafted from the measurements below. Read and adjust before submission.

I measured three areas before changing anything: what JavaScript ships, what re-renders when the
cart changes, and how fast the page loads. Each finding has the method, the numbers, and what I
did about it — including one fix I tried that made no difference and removed.

## 1. Bundle — Zod was ~19% of the JavaScript (fixed)

**How I found it.** `npm run build` showed one 443 KB (139 KB gzip) JS file. To see what was in
it, I made a throwaway build that put each npm package in its own chunk (`manualChunks`), so
Vite printed each library's minified and gzipped size:

| Package                            | Minified    | Gzipped     |
| ---------------------------------- | ----------- | ----------- |
| react-dom                          | 210.5 KB    | 65.7 KB     |
| @reduxjs/toolkit (incl. RTK Query) | 95.9 KB     | 32.3 KB     |
| **zod**                            | **85.0 KB** | **24.2 KB** |
| react-router                       | 36.8 KB     | 13.3 KB     |
| app code                           | 22.4 KB     | 7.4 KB      |

Zod was nearly as large as Redux Toolkit, yet it only validates three small shapes (a product, the
category list, the saved cart).

**Hypothesis.** Zod 4 ships `zod/mini`, a tree-shakable functional API with the same validation
rules. I built the same schemas both ways before touching the app: **27.0 KB gzip with `zod`,
7.6 KB with `zod/mini`**. I also checked in Node that every rule behaves the same (trimming,
HTTPS-only URLs rejecting `javascript:`, bounds, the stock refine, stripping unknown keys).

**Change.** `schemas.ts` and `persistence.ts` import `zod/mini` (`.check(...)` instead of chained
methods). No behaviour change: all 167 existing tests pass unmodified, including every
"rejects a malformed product" and saved-cart validation case.

**Result.**

|               | Before   | After                         |
| ------------- | -------- | ----------------------------- |
| JS (minified) | 443.1 KB | 387.3 KB                      |
| JS (gzipped)  | 139.2 KB | **124.8 KB (−14.4 KB, −10%)** |

## 2. Re-renders when the cart changes — nothing to fix

**How I checked.** I temporarily added render counters to `ProductCard`, `AddToCartButton` and the
list (`Catalog`), loaded the page in the dev server, reset the counts and clicked "Add to cart"
once. (The React DevTools Profiler shows the same; counters gave exact numbers.)

| Event             | ProductCard (12 shown) | Catalog | AddToCartButton         |
| ----------------- | ---------------------- | ------- | ----------------------- |
| Initial load      | 24                     | 2       | 24                      |
| One "Add to cart" | **0**                  | **0**   | **2** (the clicked one) |

Dev mode with `StrictMode` renders twice on purpose, so one click re-renders only the button that
was clicked (plus the header badge). That's because each button selects only its own quantity
from Redux (`selectQuantityById`), and the list doesn't read the cart at all. No `memo` needed —
consistent with the rule in `CLAUDE.md` not to pre-optimize.

## 3. Page load (LCP) — dominated by image size; documented, not fixable here

**How I measured.** A Playwright script against the **production build** (`vite preview`), with a
slow-4G profile (150 ms RTT, ~1.6 Mbps down, 4× CPU slowdown), cache disabled, reading
Largest Contentful Paint with a `PerformanceObserver`; median of 5 runs.

My first run waited only 4 s after load and reported LCP ≈ 2.2 s on a product _title_ — which was
misleading: no image had painted yet. Waiting for the network to go idle gave the real value.

| Finding                                           | Number                                       |
| ------------------------------------------------- | -------------------------------------------- |
| LCP (median of 5), LCP element is a product image | **≈ 14.7 s** (good is ≤ 2.5 s)               |
| One page of 12 product images                     | **2,694 KB** — 1500 px PNGs shown at ~300 px |
| All JavaScript, gzipped                           | 139 KB — the images are ~19× larger          |

**Tried and removed.** I made the first row of images eager with `fetchPriority="high"` and added
`<link rel="preconnect">` to `fakestoreapi.com`. LCP measured **≈ 15.4 s** — no improvement within
run-to-run noise, so I reverted both rather than keep code with no measured benefit. The
bottleneck is bytes, not order: ~2 MB of on-screen images at ~200 KB/s takes ~10 s whatever their
priority, and Chrome starts lazy images close to the viewport anyway.

**The real fix (out of scope).** Serve images at display size in a modern format — e.g. an image
CDN producing ~300 px WebP/AVIF with `srcset`/`sizes`. The images belong to the third-party API, so
there's no way to do this without adding an image proxy, which I chose not to do.

**Already in place:** every image has fixed `width`/`height` and an aspect-ratio box, so loading
images cause no layout shift (CLS), and images below the first row are lazy-loaded.

## How to reproduce

- Bundle: `npm run build`; for the per-library breakdown, a build with `manualChunks` grouping by
  package (or `npx vite-bundle-visualizer`).
- Re-renders: React DevTools → Profiler → "Highlight updates when components render", record one
  "Add to cart".
- Loading: Chrome DevTools → Lighthouse (Mobile), or Network panel with "Slow 4G" and cache
  disabled; Performance panel shows the LCP marker.
