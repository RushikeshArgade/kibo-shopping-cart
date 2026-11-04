import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Only for the jsdom project: DOM matchers, unmounting, and a clean localStorage per test.
afterEach(() => {
  cleanup()
  localStorage.clear()
})
