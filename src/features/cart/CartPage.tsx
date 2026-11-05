import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { formatCents } from '../../shared/lib/money'
import { useAnnounce } from '../../shared/ui/announcerContext'
import { PageTitle } from '../../shared/ui/PageTitle'
import type { Product } from '../products'
import {
  applyCatalogStock,
  decrement,
  increment,
  removeFromCart,
  selectCartLines,
  selectReducedIds,
} from './cartSlice'
import { CartLineItem } from './CartLineItem'
import { linesOverStock, reconcile } from './reconcile'
import type { CartLine } from './types'

type FocusTarget = number | 'heading'

const plural = (count: number) => `${count} ${count === 1 ? 'item' : 'items'}`

interface CartPageProps {
  /** Latest catalog, passed in by the app so the cart feature doesn't import product code. */
  products: Product[] | undefined
}

export function CartPage({ products }: CartPageProps) {
  const dispatch = useAppDispatch()
  const announce = useAnnounce()
  const lines = useAppSelector(selectCartLines)
  const reducedIds = useAppSelector(selectReducedIds)
  const view = reconcile(lines, products)

  // Once the catalog arrives: cap quantities above current stock, and tell the user once
  // what changed. Out-of-stock and missing products are shown from `view`, not changed.
  const reconciledWith = useRef<Product[] | null>(null)
  useEffect(() => {
    if (!products || reconciledWith.current === products) return
    reconciledWith.current = products

    const over = linesOverStock(lines, products)
    if (over.length) dispatch(applyCatalogStock(products))
    const changes = []
    if (over.length) changes.push(`${plural(over.length)} reduced to the stock available`)
    const { unavailableCount } = reconcile(lines, products)
    if (unavailableCount) changes.push(`${plural(unavailableCount)} unavailable`)
    if (changes.length) announce(`Your cart was updated: ${changes.join(', ')}.`)
  }, [products, lines, dispatch, announce])

  // When a line disappears, the button that removed it disappears too. Send focus to the
  // next line, else the previous one, else the page heading, so keyboard users aren't lost.
  const headingRef = useRef<HTMLHeadingElement>(null)
  const titleRefs = useRef(new Map<number, HTMLHeadingElement>())
  const pendingFocus = useRef<FocusTarget | null>(null)

  useEffect(() => {
    const target = pendingFocus.current
    if (target === null) return
    pendingFocus.current = null
    const element = target === 'heading' ? headingRef.current : titleRefs.current.get(target)
    element?.focus()
  }, [lines])

  function remove(line: CartLine) {
    const index = lines.indexOf(line)
    const neighbour = lines[index + 1] ?? lines[index - 1]
    pendingFocus.current = neighbour ? neighbour.productId : 'heading'
    dispatch(removeFromCart(line.productId))
    announce(`Removed ${line.snapshot.title} from cart.`)
  }

  function decrease(line: CartLine) {
    if (line.quantity <= 1) return remove(line) // decrement at 1 removes the line
    dispatch(decrement(line.productId))
    announce(`${line.snapshot.title}: quantity ${line.quantity - 1}.`)
  }

  function increase(line: CartLine) {
    dispatch(increment(line.productId))
    announce(`${line.snapshot.title}: quantity ${line.quantity + 1}.`)
  }

  return (
    <>
      <PageTitle>Your cart</PageTitle>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mb-4 rounded text-2xl font-semibold focus-visible:outline-2 focus-visible:outline-blue-700"
      >
        Your cart
      </h1>

      {lines.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
          <p className="text-slate-700">Your cart is empty.</p>
          <Link
            to="/"
            className="mt-3 inline-flex min-h-11 items-center font-medium text-blue-700 underline focus-visible:outline-2 focus-visible:outline-blue-700"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
          <ul className="flex flex-col gap-3">
            {view.lines.map(({ line, status }) => (
              <li key={line.productId}>
                <CartLineItem
                  line={line}
                  status={status}
                  reduced={reducedIds.includes(line.productId)}
                  titleRef={(element) => {
                    if (element) titleRefs.current.set(line.productId, element)
                    else titleRefs.current.delete(line.productId)
                  }}
                  onIncrement={() => increase(line)}
                  onDecrement={() => decrease(line)}
                  onRemove={() => remove(line)}
                />
              </li>
            ))}
          </ul>

          <section
            aria-labelledby="cart-summary"
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <h2 id="cart-summary" className="text-lg font-semibold">
              Summary
            </h2>
            <dl className="mt-3 flex items-baseline justify-between">
              <dt>Subtotal ({plural(view.availableCount)})</dt>
              <dd className="text-lg font-semibold tabular-nums">
                {formatCents(view.subtotalCents)}
              </dd>
            </dl>
            {view.unavailableCount > 0 && (
              <p className="mt-2 text-sm text-slate-700">
                {plural(view.unavailableCount)} unavailable, not included.
              </p>
            )}
            <Link
              to="/"
              className="mt-4 inline-flex min-h-11 items-center font-medium text-blue-700 underline focus-visible:outline-2 focus-visible:outline-blue-700"
            >
              Continue shopping
            </Link>
          </section>
        </div>
      )}
    </>
  )
}
