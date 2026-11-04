import { useSearchParams } from 'react-router'
import {
  DEFAULT_PARAMS,
  parseCatalogParams,
  toSearchParams,
  type CatalogParams,
  type SortOption,
} from './catalog'

/**
 * The URL is the single source of truth for catalog state. Category, sort and page changes add
 * a history entry (Back undoes them); search keystrokes replace the current entry, so Back
 * doesn't walk through a word letter by letter. Any change except paging returns to page 1.
 */
export function useCatalogParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = parseCatalogParams(searchParams)

  function update(changes: Partial<CatalogParams>, replace = false) {
    setSearchParams(toSearchParams({ ...params, ...changes }), { replace })
  }

  return {
    params,
    hrefForPage: (page: number) => {
      const search = toSearchParams({ ...params, page }).toString()
      return search ? `?${search}` : '?'
    },
    setSearch: (q: string) => update({ q, page: 1 }, true),
    setCategory: (category: string | null) => update({ category, page: 1 }),
    setSort: (sort: SortOption) => update({ sort, page: 1 }),
    clearFilters: () => setSearchParams(toSearchParams(DEFAULT_PARAMS)),
  }
}
