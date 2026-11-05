import { PageTitle } from '../../shared/ui/PageTitle'
import { CatalogControls } from './CatalogControls'
import { ProductList } from './ProductList'

export function ProductsPage() {
  return (
    <>
      <PageTitle>Products</PageTitle>
      <h1 className="mb-4 text-2xl font-semibold">Products</h1>
      <CatalogControls />
      <ProductList />
    </>
  )
}
