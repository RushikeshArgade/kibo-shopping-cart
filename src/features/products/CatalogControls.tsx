import { SORT_OPTIONS, type SortOption } from './catalog'
import { useGetCategoriesQuery } from './productsApi'
import { useCatalogParams } from './useCatalogParams'

const SORT_LABELS: Record<SortOption, string> = {
  featured: 'Featured',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  'rating-desc': 'Rating: high to low',
  'name-asc': 'Name: A to Z',
}

const field =
  'min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700'
const label = 'mb-1 block text-sm font-medium text-slate-800'

export function CatalogControls() {
  const { params, setSearch, setCategory, setSort } = useCatalogParams()
  const { data: categories, isError: categoriesFailed } = useGetCategoriesQuery()

  // A category from an old or edited link may not be in the list; keep it selectable so the
  // control matches what's being filtered.
  const categoryOptions =
    params.category && categories && !categories.includes(params.category)
      ? [...categories, params.category]
      : (categories ?? [])

  return (
    // <search> is the HTML element for a search landmark (replaces <form role="search">).
    <search aria-label="Products">
      <form
        onSubmit={(event) => event.preventDefault()}
        className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-[1fr_auto_auto] md:items-end"
      >
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="product-search" className={label}>
            Search products
          </label>
          <input
            id="product-search"
            type="search"
            value={params.q}
            onChange={(event) => setSearch(event.target.value)}
            className={field}
          />
        </div>

        {/* If categories fail to load, hide the filter; search and sort still work. */}
        {!categoriesFailed && (
          <div>
            <label htmlFor="product-category" className={label}>
              Category
            </label>
            <select
              id="product-category"
              value={params.category ?? ''}
              onChange={(event) => setCategory(event.target.value || null)}
              className={field}
            >
              <option value="">All categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="product-sort" className={label}>
            Sort by
          </label>
          <select
            id="product-sort"
            value={params.sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            className={field}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {SORT_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
      </form>
    </search>
  )
}
