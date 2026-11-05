import { Link, Route, Routes } from 'react-router'
import { CartLink, CartPage } from '../features/cart'
import { ProductsPage, useGetProductsQuery } from '../features/products'
import { NotFoundPage } from './NotFoundPage'

// The app layer connects the two features, so cart code never imports product code at
// runtime (only the Product type): no circular dependency between features.
function CartRoute() {
  const { data: products } = useGetProductsQuery()
  return <CartPage products={products} />
}

export function App() {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          {/* The brand is a link home, not the page heading: each page owns its own <h1>. */}
          <Link
            to="/"
            className="rounded text-xl font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            Kibo Shop
          </Link>
          <nav aria-label="Main">
            <CartLink />
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-7xl px-4 py-6">
        <Routes>
          <Route path="/" element={<ProductsPage />} />
          <Route path="/cart" element={<CartRoute />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  )
}
