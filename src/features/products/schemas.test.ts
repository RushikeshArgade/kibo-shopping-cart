import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiCategories, apiProducts } from '../../test/fixtures/products'
import { apiProductSchema, InvalidResponseError, parseCategories, parseProducts } from './schemas'

const valid = apiProducts[0]!

describe('apiProductSchema', () => {
  it('accepts a product shaped like the real API', () => {
    expect(apiProductSchema.safeParse(valid).success).toBe(true)
  })

  it.each([
    ['missing price', { ...valid, price: undefined }],
    ['price as text', { ...valid, price: 'free' }],
    ['negative price', { ...valid, price: -1 }],
    ['empty title', { ...valid, title: '   ' }],
    ['non-integer id', { ...valid, id: 1.5 }],
    ['http image', { ...valid, image: 'http://fakestoreapi.com/img/a.png' }],
    ['javascript: image', { ...valid, image: 'javascript:alert(1)' }],
    ['rating above 5', { ...valid, rating: { rate: 5.1, count: 1 } }],
    ['missing rating', { ...valid, rating: undefined }],
  ])('rejects a product with %s', (_, product) => {
    expect(apiProductSchema.safeParse(product).success).toBe(false)
  })
})

describe('parseProducts', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('converts price to cents and attaches stock', () => {
    const [backpack] = parseProducts([valid])

    expect(backpack).toMatchObject({ id: 1, priceCents: 10995, stock: 7 })
    expect(backpack).not.toHaveProperty('price')
  })

  it('drops an invalid product, keeps the rest, and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const response = [...apiProducts, { ...valid, id: 99, price: 'free' }]

    const products = parseProducts(response)

    expect(products.map((p) => p.id)).toEqual(apiProducts.map((p) => p.id))
    expect(warn).toHaveBeenCalledOnce()
  })

  it('returns an empty list for an empty response', () => {
    expect(parseProducts([])).toEqual([])
  })

  it('throws when the response is not a list', () => {
    expect(() => parseProducts({ error: 'oops' })).toThrow(InvalidResponseError)
  })

  it('throws when every product is invalid', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(() => parseProducts([{ id: 'x' }, null])).toThrow(InvalidResponseError)
  })
})

describe('parseCategories', () => {
  it('accepts the real categories list', () => {
    expect(parseCategories(apiCategories)).toEqual(apiCategories)
  })

  it('throws on a malformed list', () => {
    expect(() => parseCategories(['electronics', 42])).toThrow(InvalidResponseError)
  })
})
