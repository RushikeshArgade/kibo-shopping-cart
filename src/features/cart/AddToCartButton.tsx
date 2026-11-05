import { useAppDispatch, useAppSelector, useAppStore } from '../../app/hooks'
import { useAnnounce } from '../../shared/ui/announcerContext'
import { Button } from '../../shared/ui/Button'
import type { Product } from '../products'
import { addToCart, selectItemCount, selectQuantityById } from './cartSlice'

export function AddToCartButton({ product }: { product: Product }) {
  const dispatch = useAppDispatch()
  const store = useAppStore()
  const announce = useAnnounce()
  const inCart = useAppSelector((state) => selectQuantityById(state, product.id))

  const atMax = inCart >= product.stock

  function add() {
    dispatch(addToCart(product))
    const count = selectItemCount(store.getState())
    announce(`Added ${product.title} to cart. ${count} ${count === 1 ? 'item' : 'items'} in cart.`)
  }

  return (
    <div className="mt-2">
      {/* Disabled when out of stock or at the limit; the visible text says why. */}
      <Button
        onClick={add}
        disabled={atMax}
        // Explicit label: browsers put a stray space before ":" when the product name comes
        // from a visually hidden span. Starts with the visible text (WCAG "label in name").
        aria-label={`Add to cart: ${product.title}`}
        className="w-full"
      >
        Add to cart
      </Button>
      {/* Always takes one line, even when empty, so cards in a row keep prices and buttons aligned. */}
      <p className="mt-1 min-h-4 text-xs text-slate-700">
        {inCart > 0 && (atMax ? `Max ${product.stock} in cart` : `${inCart} in cart`)}
      </p>
    </div>
  )
}
