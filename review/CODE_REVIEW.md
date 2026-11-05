# Code review: `ProductSearch` — fetching in `useEffect` without cleanup

> **[review]** Written as I'd leave it on a teammate's pull request. Before submitting, add a line
> on where I've met this pattern in production, in my own words.

- **Before:** [`ProductSearch.before.tsx`](ProductSearch.before.tsx)
- **After:** [`ProductSearch.after.tsx`](ProductSearch.after.tsx)
- **Tests that show the difference:** [`ProductSearch.test.tsx`](ProductSearch.test.tsx)

---

Hey! Thanks for putting this together — the component is easy to read and the happy path works.
I've seen this exact pattern cause real bugs in production, though, so I'd like us to change a few
things before merging. Details below; I've pushed a suggested version in `ProductSearch.after.tsx`.

### 🔴 1. Out-of-order responses show the wrong results (must fix)

Every change to `query` starts a new request, but nothing cancels or ignores the old ones. When a
user types `s` → `sh`, both requests are in flight; if the `s` response is slower (a normal thing
on a real network), it arrives last and **overwrites the results for `sh`**. The user sees results
for something they're no longer searching for, with no indication anything is wrong.

The test `BEFORE: a slow, out-of-date response overwrites the newer one` reproduces this with a
delayed mock response.

**Suggestion:** return a cleanup function from the effect that aborts the request:

```ts
useEffect(() => {
  const controller = new AbortController()
  fetch(url, { signal: controller.signal }) /* … */
  return () => controller.abort()
}, [query])
```

React runs the cleanup before the next effect and on unmount, so a stale response can never call
`setState`. It also stops downloading results nobody will see.

### 🔴 2. Errors leave the user stuck on "Loading…" (must fix)

There's no `.catch` and no `res.ok` check. If the request fails, `loading` is never reset, so the
spinner stays forever, and the rejection goes unhandled (it shows up as an error in the console
and in error monitoring). A 500 with an HTML error page also makes `res.json()` throw.

**Suggestion:** check `res.ok`, catch errors, and show an error state — but ignore the error caused
by our own `abort()`, which isn't a real failure:

```ts
.catch(() => {
  if (!controller.signal.aborted) setState({ query, status: 'error' })
})
```

### 🟠 3. Two separate flags can disagree (should fix)

`results` and `loading` are updated separately, so it's easy to end up in impossible combinations
(this is how #2 happens). I'd keep **one state object tagged with the query it belongs to**, and
derive "loading" instead of storing it:

```ts
type SearchState =
  { query: string; status: 'success'; results: SearchResult[] } | { query: string; status: 'error' }

const loading = state?.query !== query
```

This also removes the `setLoading(true)` call at the start of the effect — calling `setState`
synchronously inside an effect triggers an extra render, and our lint rules flag it.

### 🟡 4. The query isn't URL-encoded (should fix)

`?q=${query}` breaks for searches like `salt & pepper` — the server receives `salt ` and a stray
`pepper` parameter. Use `encodeURIComponent(query)`. There's a test for this too.

### 💬 5. In this codebase: consider RTK Query instead (non-blocking)

The suggested version fixes the bugs with plain React, which is fine for a one-off. But we already
use RTK Query for server data, and it handles all of the above for us — cancelling stale requests,
loading and error state, caching, retries and request de-duplication. If this search grows (paging,
debouncing, reuse elsewhere), I'd move it to a `searchProducts` endpoint rather than maintain
hand-written fetching logic in a component. Happy to pair on that if useful.

---

### Why the refactor is better — summary

|                            | Before                                   | After                                             |
| -------------------------- | ---------------------------------------- | ------------------------------------------------- |
| Fast typing / slow network | Old results can overwrite new ones       | Out-of-date requests are cancelled                |
| Request fails              | Stuck on "Loading…", unhandled rejection | Error message shown                               |
| State                      | `results` + `loading` can disagree       | One state, tagged with its query; loading derived |
| Special characters         | Query breaks the URL                     | Encoded                                           |
| Unmount mid-request        | Request keeps running                    | Aborted                                           |

**Verified:** the race-condition test fails if the `controller.abort()` cleanup is removed from the
refactored version, so the test really guards the fix.
