import { describe, expect, it } from 'vitest'
import { stockFor } from './inventory'

const catalogIds = Array.from({ length: 20 }, (_, i) => i + 1)

describe('stockFor', () => {
  it('returns the same stock for the same product every time', () => {
    expect(stockFor(7)).toBe(stockFor(7))
  })

  it('keeps stock between 0 and 10 for every product', () => {
    for (const id of catalogIds) {
      expect(stockFor(id)).toBeGreaterThanOrEqual(0)
      expect(stockFor(id)).toBeLessThanOrEqual(10)
    }
  })

  it('makes product 11 out of stock so the sold-out state can be shown', () => {
    expect(stockFor(11)).toBe(0)
  })

  it('has some low-stock products (1–3) to exercise the quantity limit', () => {
    const low = catalogIds.filter((id) => stockFor(id) >= 1 && stockFor(id) <= 3)
    expect(low.length).toBeGreaterThan(0)
  })
})
