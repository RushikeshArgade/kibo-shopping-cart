import { describe, expect, it } from 'vitest'
import { stockLabel } from './stockLabel'

describe('stockLabel', () => {
  it.each([
    [0, 'Out of stock'],
    [1, 'Only 1 left'],
    [3, 'Only 3 left'], // threshold is inclusive
    [4, 'In stock'],
    [10, 'In stock'],
  ])('labels stock %d as "%s"', (stock, label) => {
    expect(stockLabel(stock)).toBe(label)
  })
})
