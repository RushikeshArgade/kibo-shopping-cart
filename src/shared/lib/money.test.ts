import { describe, expect, it } from 'vitest'
import { formatCents, toCents } from './money'

describe('toCents', () => {
  it.each([
    [109.95, 10995],
    [22.3, 2230],
    [999.99, 99999],
    [695, 69500],
    [0, 0],
  ])('converts %d dollars to %d cents', (dollars, cents) => {
    expect(toCents(dollars)).toBe(cents)
  })

  // These multiply to just below the whole cent (19.99 * 100 = 1998.9999…),
  // so truncating instead of rounding would lose a cent.
  it.each([
    [19.99, 1999],
    [4.35, 435],
    [1.15, 115],
    [0.29, 29],
  ])('rounds %d dollars up to %d cents despite float drift', (dollars, cents) => {
    expect(toCents(dollars)).toBe(cents)
  })

  // 0.1 + 0.2 = 0.30000000000000004, so this drifts above the whole cent.
  it('rounds sums that drift above the whole cent', () => {
    expect(toCents(0.1 + 0.2)).toBe(30)
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'rejects non-finite amount %d',
    (dollars) => {
      expect(() => toCents(dollars)).toThrow(RangeError)
    },
  )
})

describe('formatCents', () => {
  it.each([
    [98500, '$985.00'],
    [123456, '$1,234.56'],
    [5, '$0.05'],
    [0, '$0.00'],
  ])('formats %d cents as %s', (cents, text) => {
    expect(formatCents(cents)).toBe(text)
  })

  it('rejects fractional cents', () => {
    expect(() => formatCents(10.5)).toThrow(RangeError)
  })
})
