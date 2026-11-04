import type { ReactNode } from 'react'
import { Button } from '../../shared/ui/Button'
import { ProductCard } from './ProductCard'
import { ProductCardSkeleton } from './ProductCardSkeleton'
import { useGetProductsQuery } from './productsApi'

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

  return (
    <Grid>
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </Grid>
  )
}
