import { render, screen, waitFor } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../src/test/server'
import { ProductSearch as After, SEARCH_URL } from './ProductSearch.after'
import { ProductSearch as Before } from './ProductSearch.before'

// The user types "s" then "sh". The response for "s" is slow and arrives *after* the one for
// "sh" — a normal situation on a real network.
function serveOutOfOrderResponses() {
  server.use(
    http.get(SEARCH_URL, async ({ request }) => {
      const q = new URL(request.url).searchParams.get('q')
      if (q === 's') {
        await delay(150)
        return HttpResponse.json([{ id: 1, title: 'Result for "s" (stale)' }])
      }
      return HttpResponse.json([{ id: 2, title: 'Result for "sh"' }])
    }),
  )
}

async function typeSThenSh(Component: typeof Before) {
  const { rerender } = render(<Component query="s" />)
  rerender(<Component query="sh" />)
  await new Promise((resolve) => setTimeout(resolve, 300)) // let both responses arrive
}

describe('Code review exercise: fetching in useEffect without cleanup', () => {
  it('BEFORE: a slow, out-of-date response overwrites the newer one', async () => {
    serveOutOfOrderResponses()
    await typeSThenSh(Before)

    // The bug, demonstrated: the screen shows results for a query the user no longer has.
    expect(screen.getByText('Result for "s" (stale)')).toBeInTheDocument()
  })

  it('AFTER: the out-of-date request is cancelled, so the newest results win', async () => {
    serveOutOfOrderResponses()
    await typeSThenSh(After)

    expect(screen.getByText('Result for "sh"')).toBeInTheDocument()
    expect(screen.queryByText(/stale/)).not.toBeInTheDocument()
  })

  // (No BEFORE test for errors: the old code has no .catch, so a failed request becomes an
  // unhandled promise rejection — which is part of the bug, and would fail the test run itself.)
  it('AFTER: a server error shows an error message', async () => {
    server.use(http.get(SEARCH_URL, () => new HttpResponse('Server error', { status: 500 })))
    render(<After query="shoes" />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Search failed')
  })

  it('AFTER: the query is URL-encoded, so "&" and spaces reach the server intact', async () => {
    let received: string | null = null
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        received = new URL(request.url).searchParams.get('q')
        return HttpResponse.json([])
      }),
    )
    render(<After query="salt & pepper" />)

    await waitFor(() => expect(received).toBe('salt & pepper'))
  })
})
