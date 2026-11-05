import { createListenerMiddleware, isAnyOf, type Dispatch } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'
import {
  addToCart,
  applyCatalogStock,
  clearCart,
  decrement,
  increment,
  removeFromCart,
  replaceCart,
  selectCartLines,
} from './cartSlice'
import { CART_STORAGE_KEY, parseSavedCart, saveCart } from './persistence'

/**
 * Saves the cart after every change the user makes in this tab. replaceCart (a change that
 * came from another tab) is deliberately not listed: saving it would fire a storage event in
 * the other tab, which would save again, and the two tabs would update each other forever.
 */
export const cartPersistence = createListenerMiddleware()

cartPersistence.startListening({
  matcher: isAnyOf(addToCart, increment, decrement, removeFromCart, clearCart, applyCatalogStock),
  effect: (_action, api) => saveCart(selectCartLines(api.getState() as RootState)),
})

/**
 * Keeps this tab's cart in step with other tabs: the browser fires `storage` in every other
 * tab when one tab writes. Last write wins. Returns a function that stops listening.
 */
export function syncCartAcrossTabs(dispatch: Dispatch) {
  function onStorage(event: StorageEvent) {
    // key is null when storage was cleared entirely.
    if (event.key !== CART_STORAGE_KEY && event.key !== null) return
    dispatch(replaceCart(parseSavedCart(event.newValue)))
  }
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}
