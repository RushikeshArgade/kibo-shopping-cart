// @vitest-environment jsdom
// Needs a real localStorage and window events, which plain Node doesn't have.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeStore } from '../../app/store'
import type { Product } from '../products'
import { addToCart, cartStateFromLines, increment, replaceCart, selectCartLines } from './cartSlice'
import { syncCartAcrossTabs } from './cartSync'
import { CART_STORAGE_KEY, loadCart, parseSavedCart, saveCart } from './persistence'
import type { CartLine } from './types'

const backpack: Product = {
  id: 1,
  title: 'Backpack',
  priceCents: 10995,
  description: '',
  category: "men's clothing",
  image: 'https://fakestoreapi.com/img/1.png',
  rating: { rate: 3.9, count: 120 },
  stock: 7,
}

const line: CartLine = {
  productId: 1,
  quantity: 2,
  snapshot: {
    title: 'Backpack',
    image: 'https://fakestoreapi.com/img/1.png',
    priceCents: 10995,
    stock: 7,
  },
}

const saved = (value: unknown) => JSON.stringify(value)

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('parseSavedCart', () => {
  it('reads a valid saved cart', () => {
    expect(parseSavedCart(saved({ version: 1, lines: [line] }))).toEqual([line])
  })

  it.each([
    ['nothing saved', null],
    ['corrupted JSON', '{not json'],
    ['another version', saved({ version: 2, lines: [line] })],
    ['quantity above stock', saved({ version: 1, lines: [{ ...line, quantity: 9 }] })],
    ['zero quantity', saved({ version: 1, lines: [{ ...line, quantity: 0 }] })],
    [
      'an http image',
      saved({
        version: 1,
        lines: [{ ...line, snapshot: { ...line.snapshot, image: 'http://x.png' } }],
      }),
    ],
    ['missing lines', saved({ version: 1 })],
  ])('gives an empty cart for %s', (_, raw) => {
    expect(parseSavedCart(raw)).toEqual([])
  })
})

describe('saveCart and loadCart', () => {
  it('round-trips the cart through localStorage', () => {
    saveCart([line])

    expect(loadCart()).toEqual([line])
  })

  it('keeps working when storage is full or blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    expect(() => saveCart([line])).not.toThrow()
    expect(loadCart()).toEqual([])
  })
})

describe('cart persistence in the store', () => {
  it('saves every change the user makes', () => {
    const store = makeStore()

    store.dispatch(addToCart(backpack))
    store.dispatch(increment(1))

    expect(loadCart()).toEqual([{ ...line, quantity: 2 }])
  })

  it('restores the cart after a reload', () => {
    const before = makeStore()
    before.dispatch(addToCart(backpack))

    const after = makeStore({ cart: cartStateFromLines(loadCart()) }) // like main.tsx on startup

    expect(selectCartLines(after.getState())).toEqual(selectCartLines(before.getState()))
  })

  it('does not save a cart that came from another tab', () => {
    const store = makeStore()
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    store.dispatch(replaceCart([line]))

    expect(setItem).not.toHaveBeenCalled()
  })
})

describe('syncCartAcrossTabs', () => {
  function otherTabWrites(key: string | null, newValue: string | null) {
    window.dispatchEvent(new StorageEvent('storage', { key, newValue }))
  }

  it("replaces this tab's cart with the other tab's and does not write back", () => {
    const store = makeStore()
    const stop = syncCartAcrossTabs(store.dispatch)
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    otherTabWrites(CART_STORAGE_KEY, saved({ version: 1, lines: [line] }))

    expect(selectCartLines(store.getState())).toEqual([line])
    expect(setItem).not.toHaveBeenCalled() // no ping-pong between tabs
    stop()
  })

  it('empties the cart when the other tab clears storage', () => {
    const store = makeStore({ cart: cartStateFromLines([line]) })
    const stop = syncCartAcrossTabs(store.dispatch)

    otherTabWrites(null, null)

    expect(selectCartLines(store.getState())).toEqual([])
    stop()
  })

  it('ignores changes to other storage keys', () => {
    const store = makeStore({ cart: cartStateFromLines([line]) })
    const stop = syncCartAcrossTabs(store.dispatch)

    otherTabWrites('something-else', 'x')

    expect(selectCartLines(store.getState())).toEqual([line])
    stop()
  })

  it('stops listening when asked', () => {
    const store = makeStore()
    syncCartAcrossTabs(store.dispatch)()

    otherTabWrites(CART_STORAGE_KEY, saved({ version: 1, lines: [line] }))

    expect(selectCartLines(store.getState())).toEqual([])
  })
})
