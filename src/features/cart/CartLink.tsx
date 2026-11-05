import { Link } from 'react-router'
import { useAppSelector } from '../../app/hooks'
import { selectItemCount } from './cartSlice'

export function CartLink() {
  const count = useAppSelector(selectItemCount)

  return (
    <Link
      to="/cart"
      // Shows "Cart (3)"; screen readers hear "Cart, 3 items". An explicit label gives the same
      // name in every browser (hidden spans can get stray spaces before punctuation).
      aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
      className="inline-flex min-h-11 items-center gap-1 rounded px-2 font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
    >
      Cart <span aria-hidden="true">({count})</span>
    </Link>
  )
}
