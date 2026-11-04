import type { Product } from './types'

// 12 divides evenly by 2, 3 and 4 columns, so every row on a full page is complete.
export const PAGE_SIZE = 12

export const SORT_OPTIONS = [
  'featured',
  'price-asc',
  'price-desc',
  'rating-desc',
  'name-asc',
] as const
export type SortOption = (typeof SORT_OPTIONS)[number]

export interface CatalogParams {
  category: string | null
  q: string
  sort: SortOption
  page: number
}

export const DEFAULT_PARAMS: CatalogParams = { category: null, q: '', sort: 'featured', page: 1 }

export interface CatalogPage {
  items: Product[]
  total: number
  page: number
  pageCount: number
  /** 1-based position of the first and last item shown; both 0 when there are no results. */
  from: number
  to: number
}

function isSortOption(value: string | null): value is SortOption {
  return SORT_OPTIONS.includes(value as SortOption)
}

/** Reads params from the URL. Bad values fall back to defaults so an old or hand-edited link still works. */
export function parseCatalogParams(search: URLSearchParams): CatalogParams {
  const sort = search.get('sort')
  const page = Number(search.get('page'))
  return {
    category: search.get('category')?.trim() || null,
    q: search.get('q') ?? '',
    sort: isSortOption(sort) ? sort : DEFAULT_PARAMS.sort,
    page: Number.isInteger(page) && page >= 1 ? page : DEFAULT_PARAMS.page,
  }
}

/** Writes params to the URL, leaving out defaults so URLs stay short and shareable. */
export function toSearchParams(params: CatalogParams): URLSearchParams {
  const search = new URLSearchParams()
  if (params.category) search.set('category', params.category)
  if (params.q.trim()) search.set('q', params.q)
  if (params.sort !== DEFAULT_PARAMS.sort) search.set('sort', params.sort)
  if (params.page > 1) search.set('page', String(params.page))
  return search
}

const comparators: Record<Exclude<SortOption, 'featured'>, (a: Product, b: Product) => number> = {
  'price-asc': (a, b) => a.priceCents - b.priceCents,
  'price-desc': (a, b) => b.priceCents - a.priceCents,
  'rating-desc': (a, b) => b.rating.rate - a.rating.rate,
  'name-asc': (a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }),
}

/**
 * Filter → sort → paginate. Pure, so it's easy to test; with a server-paginated catalog this
 * is the logic that would move to the API. toSorted is stable: ties keep the API's order.
 */
export function queryCatalog(
  products: Product[],
  params: CatalogParams,
  pageSize = PAGE_SIZE,
): CatalogPage {
  const q = params.q.trim().toLowerCase()
  const filtered = products.filter(
    (p) =>
      (!params.category || p.category === params.category) &&
      (!q || p.title.toLowerCase().includes(q)),
  )
  const sorted = params.sort === 'featured' ? filtered : filtered.toSorted(comparators[params.sort])

  const total = sorted.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, params.page), pageCount)
  const start = (page - 1) * pageSize
  const items = sorted.slice(start, start + pageSize)

  return {
    items,
    total,
    page,
    pageCount,
    from: total ? start + 1 : 0,
    to: start + items.length,
  }
}
