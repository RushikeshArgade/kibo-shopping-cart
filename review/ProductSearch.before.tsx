// BEFORE — the version under review. Kept as-is so the problems are visible; see CODE_REVIEW.md.
// (Excluded from lint in .oxlintrc.json: it intentionally contains the anti-pattern.)
import { useEffect, useState } from 'react'

export const SEARCH_URL = 'https://api.example.test/products/search'

interface SearchResult {
  id: number
  title: string
}

export function ProductSearch({ query }: { query: string }) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`${SEARCH_URL}?q=${query}`)
      .then((res) => res.json())
      .then((data) => {
        setResults(data)
        setLoading(false)
      })
  }, [query])

  if (loading) return <p>Loading…</p>

  return (
    <ul>
      {results.map((result) => (
        <li key={result.id}>{result.title}</li>
      ))}
    </ul>
  )
}
