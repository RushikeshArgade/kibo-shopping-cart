import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PARAMS,
  parseCatalogParams,
  queryCatalog,
  toSearchParams,
  type CatalogParams,
} from './catalog'
import type { Product } from './types'

function product(id: number, overrides: Partial<Product> = {}): Product {
  return {
    id,
    title: `Product ${id}`,
    priceCents: 1000,
    description: '',
    category: 'electronics',
    image: `https://fakestoreapi.com/img/${id}.png`,
    rating: { rate: 3, count: 10 },
    stock: 5,
    ...overrides,
  }
}

const catalog: Product[] = [
  product(1, { title: 'Backpack', category: "men's clothing", priceCents: 10995 }),
  product(2, { title: 'SSD Drive 256GB', priceCents: 10900, rating: { rate: 4.8, count: 1 } }),
  product(3, { title: 'gold ring', category: 'jewelery', priceCents: 695 }),
  product(4, { title: 'External SSD', priceCents: 6400, rating: { rate: 4.8, count: 1 } }),
  product(5, { title: 'Monitor', priceCents: 10900, rating: { rate: 2.2, count: 1 } }),
]

function query(params: Partial<CatalogParams>, products = catalog, pageSize = 12) {
  return queryCatalog(products, { ...DEFAULT_PARAMS, ...params }, pageSize)
}

const ids = (items: Product[]) => items.map((p) => p.id)

describe('queryCatalog — filtering', () => {
  it('returns everything in API order by default', () => {
    expect(ids(query({}).items)).toEqual([1, 2, 3, 4, 5])
  })

  it('filters by exact category', () => {
    expect(ids(query({ category: 'electronics' }).items)).toEqual([2, 4, 5])
  })

  it('searches titles ignoring case and surrounding spaces', () => {
    expect(ids(query({ q: '  ssd ' }).items)).toEqual([2, 4])
  })

  it('combines category and search', () => {
    expect(ids(query({ category: 'electronics', q: 'drive' }).items)).toEqual([2])
  })

  it('returns an empty page, not an error, when nothing matches', () => {
    expect(query({ q: 'unicorn' })).toMatchObject({
      items: [],
      total: 0,
      page: 1,
      pageCount: 1,
      from: 0,
      to: 0,
    })
  })
})

describe('queryCatalog — sorting', () => {
  it('sorts by price low to high, keeping API order for equal prices', () => {
    // 2 and 5 both cost 10900: 2 comes first in the API, so it stays first.
    expect(ids(query({ sort: 'price-asc' }).items)).toEqual([3, 4, 2, 5, 1])
  })

  it('sorts by price high to low, keeping API order for equal prices', () => {
    expect(ids(query({ sort: 'price-desc' }).items)).toEqual([1, 2, 5, 4, 3])
  })

  it('sorts by rating high to low, keeping API order for equal ratings', () => {
    expect(ids(query({ sort: 'rating-desc' }).items)).toEqual([2, 4, 1, 3, 5])
  })

  it('sorts by name A to Z ignoring case', () => {
    // "gold ring" is lowercase but still sorts between "External SSD" and "Monitor".
    expect(ids(query({ sort: 'name-asc' }).items)).toEqual([1, 4, 3, 5, 2])
  })

  it('does not reorder the original list', () => {
    const products = [...catalog]
    query({ sort: 'price-asc' }, products)
    expect(ids(products)).toEqual([1, 2, 3, 4, 5])
  })
})

describe('queryCatalog — pagination', () => {
  const many = Array.from({ length: 20 }, (_, i) => product(i + 1))

  it('returns the first page with its range', () => {
    expect(query({ page: 1 }, many)).toMatchObject({
      total: 20,
      page: 1,
      pageCount: 2,
      from: 1,
      to: 12,
    })
  })

  it('returns a partial last page', () => {
    const last = query({ page: 2 }, many)
    expect(last).toMatchObject({ page: 2, from: 13, to: 20 })
    expect(last.items).toHaveLength(8)
  })

  it('moves a page past the end to the last page', () => {
    expect(query({ page: 99 }, many)).toMatchObject({ page: 2, from: 13, to: 20 })
  })

  it('treats an exact multiple of the page size as full pages', () => {
    expect(query({}, many.slice(0, 12)).pageCount).toBe(1)
  })

  it('paginates after filtering', () => {
    const mixed = many.map((p) => (p.id % 2 ? p : { ...p, category: 'jewelery' }))
    expect(query({ category: 'jewelery' }, mixed, 4)).toMatchObject({ total: 10, pageCount: 3 })
  })
})

describe('parseCatalogParams', () => {
  it('reads every param', () => {
    const search = new URLSearchParams('category=jewelery&q=ring&sort=price-desc&page=2')
    expect(parseCatalogParams(search)).toEqual({
      category: 'jewelery',
      q: 'ring',
      sort: 'price-desc',
      page: 2,
    })
  })

  it('uses defaults when params are missing', () => {
    expect(parseCatalogParams(new URLSearchParams())).toEqual(DEFAULT_PARAMS)
  })

  it.each([
    ['unknown sort', 'sort=cheapest', { sort: 'featured' }],
    ['non-numeric page', 'page=abc', { page: 1 }],
    ['zero page', 'page=0', { page: 1 }],
    ['negative page', 'page=-3', { page: 1 }],
    ['fractional page', 'page=1.5', { page: 1 }],
    ['blank category', 'category=%20', { category: null }],
  ])('falls back to the default for %s', (_, query, expected) => {
    expect(parseCatalogParams(new URLSearchParams(query))).toMatchObject(expected)
  })
})

describe('toSearchParams', () => {
  it('leaves defaults out of the URL', () => {
    expect(toSearchParams(DEFAULT_PARAMS).toString()).toBe('')
  })

  it('writes only the params that differ from the defaults', () => {
    const search = toSearchParams({ ...DEFAULT_PARAMS, category: "men's clothing", page: 2 })
    expect(Object.fromEntries(search)).toEqual({ category: "men's clothing", page: '2' })
  })

  it('round-trips through parseCatalogParams', () => {
    const params: CatalogParams = { category: 'electronics', q: 'ssd', sort: 'name-asc', page: 3 }
    expect(parseCatalogParams(toSearchParams(params))).toEqual(params)
  })
})
