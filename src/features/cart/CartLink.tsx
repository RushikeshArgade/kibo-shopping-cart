import { Link } from 'react-router'
import { useAppSelector } from '../../app/hooks'
import { selectItemCount } from './cartSlice'

export function CartLink() {
  const count = useAppSelector(selectItemCount)

  return (
    <Link
      to="/cart"
      className="inline-flex min-h-11 items-center gap-1 rounded px-2 font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
    >
      Cart
      {/* Visual "(3)"; screen readers hear "Cart, 3 items". */}
      <span aria-hidden="true">({count})</span>
      <span className="sr-only">
        , {count} {count === 1 ? 'item' : 'items'}
      </span>
    </Link>
  )
}
