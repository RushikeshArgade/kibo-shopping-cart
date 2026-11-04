import { useEffect, useRef, type ReactNode } from 'react'
import { Button } from '../../shared/ui/Button'
import { Pagination } from '../../shared/ui/Pagination'
import { queryCatalog } from './catalog'
import { ProductCard } from './ProductCard'
import { ProductCardSkeleton } from './ProductCardSkeleton'
import { useGetProductsQuery } from './productsApi'
import type { Product } from './types'
import { useCatalogParams } from './useCatalogParams'

const SKELETON_COUNT = 8

// 2 columns on mobile (common e-commerce pattern), 3 on tablet, 4 on desktop.
function Grid({ children, ...rest }: { children: ReactNode; 'aria-hidden'?: boolean }) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4" {...rest}>
      {children}
    </ul>
  )
}

export function ProductList() {
  const { data: products, isLoading, isError, refetch } = useGetProductsQuery()

  if (isLoading) {
    return (
      <div aria-busy="true">
        {/* <output> is for results of a calculation or user action, and its support as a
            live region is less consistent than an explicit role="status". */}
        {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role */}
        <p role="status" className="sr-only">
          Loading products
        </p>
        <Grid aria-hidden>
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <li key={i}>
              <ProductCardSkeleton />
            </li>
          ))}
        </Grid>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p role="alert" className="text-red-800">
          We couldn't load products.
        </p>
        <Button className="mt-4" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  if (!products?.length) {
    return <p className="text-slate-700">No products available right now.</p>
  }

  return <Catalog products={products} />
}

function Catalog({ products }: { products: Product[] }) {
  const { params, hrefForPage, clearFilters } = useCatalogParams()
  const result = queryCatalog(products, params)

  // After a page change, move focus to the summary (focus also scrolls it into view), so
  // keyboard and screen-reader users aren't left at the bottom on the old pagination links.
  const summaryRef = useRef<HTMLParagraphElement>(null)
  const previousPage = useRef(result.page)
  useEffect(() => {
    if (previousPage.current !== result.page) summaryRef.current?.focus()
    previousPage.current = result.page
  }, [result.page])

  return (
    <>
      {/* Always rendered: a live region only announces changes if it already exists. */}
      <p
        ref={summaryRef}
        tabIndex={-1}
        aria-live="polite"
        className="mb-3 rounded text-sm text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-700"
      >
        {result.total
          ? `Showing ${result.from}–${result.to} of ${result.total} products`
          : 'No products match your filters.'}
      </p>

      {result.total ? (
        <>
          <Grid>
            {result.items.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </Grid>
          <Pagination page={result.page} pageCount={result.pageCount} hrefFor={hrefForPage} />
        </>
      ) : (
        <Button variant="secondary" onClick={clearFilters}>
          Clear filters
        </Button>
      )}
    </>
  )
}
