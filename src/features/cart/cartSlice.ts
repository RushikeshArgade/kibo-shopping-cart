import {
  createEntityAdapter,
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'
import type { Product } from '../products'
import type { CartLine } from './types'

// Normalized: lines by product id plus an ordered id list (the order items were added).
const cartAdapter = createEntityAdapter({ selectId: (line: CartLine) => line.productId })

const clamp = (quantity: number, stock: number) => Math.max(0, Math.min(quantity, stock))

// Reducers are synchronous and clamp on every change, so any number of rapid clicks can
// never push a quantity past stock.
const cartSlice = createSlice({
  name: 'cart',
  initialState: cartAdapter.getInitialState(),
  reducers: {
    addToCart(state, action: PayloadAction<Product>) {
      const { id, title, image, priceCents, stock } = action.payload
      const line = state.entities[id]
      if (line) {
        // The product passed in is the latest catalog data, so refresh the snapshot too.
        line.snapshot = { title, image, priceCents, stock }
        line.quantity = clamp(line.quantity + 1, stock)
        if (line.quantity === 0) cartAdapter.removeOne(state, id)
        return
      }
      if (stock < 1) return
      cartAdapter.addOne(state, {
        productId: id,
        quantity: 1,
        snapshot: { title, image, priceCents, stock },
      })
    },
    increment(state, action: PayloadAction<number>) {
      const line = state.entities[action.payload]
      if (line) line.quantity = clamp(line.quantity + 1, line.snapshot.stock)
    },
    decrement(state, action: PayloadAction<number>) {
      const line = state.entities[action.payload]
      if (!line) return
      if (line.quantity <= 1) cartAdapter.removeOne(state, action.payload)
      else line.quantity -= 1
    },
    removeFromCart(state, action: PayloadAction<number>) {
      cartAdapter.removeOne(state, action.payload)
    },
    clearCart(state) {
      cartAdapter.removeAll(state)
    },
    /** Replaces the whole cart, e.g. with the version another tab saved. */
    replaceCart(state, action: PayloadAction<CartLine[]>) {
      cartAdapter.setAll(state, action.payload)
    },
  },
})

export const { addToCart, increment, decrement, removeFromCart, clearCart, replaceCart } =
  cartSlice.actions
export const cartReducer = cartSlice.reducer

/** Builds cart state from saved lines, for the store's preloaded state at startup. */
export function cartStateFromLines(lines: CartLine[]) {
  return cartAdapter.setAll(cartAdapter.getInitialState(), lines)
}

const adapterSelectors = cartAdapter.getSelectors((state: RootState) => state.cart)

export const selectCartLines = adapterSelectors.selectAll

export const selectItemCount = createSelector([selectCartLines], (lines) =>
  lines.reduce((count, line) => count + line.quantity, 0),
)

// Integer cents throughout: quantity × cents never produces floating-point drift.
export const selectSubtotalCents = createSelector([selectCartLines], (lines) =>
  lines.reduce((sum, line) => sum + line.quantity * line.snapshot.priceCents, 0),
)

export const selectQuantityById = (state: RootState, productId: number) =>
  state.cart.entities[productId]?.quantity ?? 0
