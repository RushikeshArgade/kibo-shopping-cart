import { Link } from 'react-router'

interface PaginationProps {
  page: number
  pageCount: number
  /** Real links (not buttons): pages can be opened in a new tab, shared, and crawled. */
  hrefFor: (page: number) => string
}

const item =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border px-3 text-sm ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700'
const enabled = `${item} border-slate-300 bg-white hover:bg-slate-100`
const current = `${item} border-slate-900 bg-slate-900 text-white`
const disabled = `${item} border-slate-200 text-slate-500`

export function Pagination({ page, pageCount, hrefFor }: PaginationProps) {
  if (pageCount <= 1) return null

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1)

  return (
    <nav aria-label="Pagination" className="mt-6">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          {page > 1 ? (
            <Link to={hrefFor(page - 1)} className={enabled}>
              Previous
            </Link>
          ) : (
            <span aria-disabled="true" className={disabled}>
              Previous
            </span>
          )}
        </li>
        {pages.map((n) => (
          <li key={n}>
            <Link
              to={hrefFor(n)}
              aria-current={n === page ? 'page' : undefined}
              aria-label={`Page ${n}`}
              className={n === page ? current : enabled}
            >
              {n}
            </Link>
          </li>
        ))}
        <li>
          {page < pageCount ? (
            <Link to={hrefFor(page + 1)} className={enabled}>
              Next
            </Link>
          ) : (
            <span aria-disabled="true" className={disabled}>
              Next
            </span>
          )}
        </li>
      </ul>
    </nav>
  )
}
