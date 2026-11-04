import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './server'

// Shared by every test project (Node and jsdom).
// MSW v3 renamed v2's `onUnhandledRequest` to `onUnhandledFrame`.
// 'error' makes any request without a handler fail the test instead of hitting the real API.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => server.close())
