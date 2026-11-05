// AFTER — the refactor suggested in CODE_REVIEW.md.
import { useEffect, useState } from 'react'

export const SEARCH_URL = 'https://api.example.test/products/search'

interface SearchResult {
  id: number
  title: string
}

// One state object, tagged with the query it belongs to: no separate `loading` flag to forget
// to reset, and no way to show results for a query the user has already changed.
type SearchState =
  { query: string; status: 'success'; results: SearchResult[] } | { query: string; status: 'error' }

export function ProductSearch({ query }: { query: string }) {
  const [state, setState] = useState<SearchState | null>(null)

  useEffect(() => {
    // Cancel this request if the query changes or the component unmounts, so a slow,
    // out-of-date response can never overwrite a newer one.
    const controller = new AbortController()

    fetch(`${SEARCH_URL}?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Search failed: HTTP ${res.status}`)
        return res.json() as Promise<SearchResult[]>
      })
      .then((results) => setState({ query, status: 'success', results }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ query, status: 'error' })
      })

    return () => controller.abort()
  }, [query])

  // Derived, not stored: we're loading whenever the last answer is for a different query.
  if (state?.query !== query) return <p>Loading…</p>
  if (state.status === 'error') return <p role="alert">Search failed. Please try again.</p>

  return (
    <ul>
      {state.results.map((result) => (
        <li key={result.id}>{result.title}</li>
      ))}
    </ul>
  )
}
