import { describe, expect, it } from 'vitest'
import type { Product } from '../products'
import { linesOverStock, reconcile } from './reconcile'
import type { CartLine } from './types'

function product(id: number, stock: number): Product {
  return {
    id,
    title: `Product ${id}`,
    priceCents: 1000,
    description: '',
    category: 'electronics',
    image: `https://fakestoreapi.com/img/${id}.png`,
    rating: { rate: 4, count: 10 },
    stock,
  }
}

function line(productId: number, quantity: number, priceCents = 1000): CartLine {
  return {
    productId,
    quantity,
    snapshot: {
      title: `Product ${productId}`,
      image: 'https://x.test/a.png',
      priceCents,
      stock: 9,
    },
  }
}

describe('reconcile', () => {
  it('treats every line as available while the catalog is not loaded', () => {
    const result = reconcile([line(1, 2), line(2, 1)], undefined)

    expect(result.lines.map((l) => l.status)).toEqual(['ok', 'ok'])
    expect(result).toMatchObject({ subtotalCents: 3000, availableCount: 3, unavailableCount: 0 })
  })

  it('marks out-of-stock and missing products and leaves them out of the totals', () => {
    const result = reconcile(
      [line(1, 2, 500), line(2, 1), line(3, 4)],
      [product(1, 5), product(2, 0)], // 3 is missing
    )

    expect(result.lines.map((l) => l.status)).toEqual(['ok', 'outOfStock', 'unavailable'])
    expect(result).toMatchObject({ subtotalCents: 1000, availableCount: 2, unavailableCount: 2 })
  })
})

describe('linesOverStock', () => {
  it('finds lines above a non-zero stock only', () => {
    const lines = [line(1, 5), line(2, 1), line(3, 2), line(4, 1)]
    const catalog = [product(1, 3), product(2, 3), product(3, 0)] // 4 missing

    expect(linesOverStock(lines, catalog).map((l) => l.productId)).toEqual([1])
  })
})
