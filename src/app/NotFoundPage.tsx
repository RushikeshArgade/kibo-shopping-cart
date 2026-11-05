import { Link } from 'react-router'
import { PageTitle } from '../shared/ui/PageTitle'

// Vercel's SPA rewrite sends every URL to the app, so unknown paths must be handled here.
export function NotFoundPage() {
  return (
    <>
      <PageTitle>Page not found</PageTitle>
      <h1 className="mb-2 text-2xl font-semibold">Page not found</h1>
      <p className="text-slate-700">The page you're looking for doesn't exist.</p>
      <Link
        to="/"
        className="mt-3 inline-flex min-h-11 items-center font-medium text-blue-700 underline focus-visible:outline-2 focus-visible:outline-blue-700"
      >
        Back to products
      </Link>
    </>
  )
}
