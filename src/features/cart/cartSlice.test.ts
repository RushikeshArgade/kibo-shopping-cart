import { describe, expect, it } from 'vitest'
import { makeStore } from '../../app/store'
import type { Product } from '../products'
import {
  addToCart,
  applyCatalogStock,
  clearCart,
  decrement,
  increment,
  removeFromCart,
  selectCartLines,
  selectItemCount,
  selectQuantityById,
  selectReducedIds,
  selectSubtotalCents,
} from './cartSlice'

function product(id: number, overrides: Partial<Product> = {}): Product {
  return {
    id,
    title: `Product ${id}`,
    priceCents: 1000,
    description: '',
    category: 'electronics',
    image: `https://fakestoreapi.com/img/${id}.png`,
    rating: { rate: 4, count: 10 },
    stock: 5,
    ...overrides,
  }
}

// Exercise the real store: reducers and selectors together, as the app uses them.
function setup() {
  const store = makeStore()
  return {
    store,
    dispatch: store.dispatch,
    lines: () => selectCartLines(store.getState()),
    count: () => selectItemCount(store.getState()),
    subtotal: () => selectSubtotalCents(store.getState()),
    qty: (id: number) => selectQuantityById(store.getState(), id),
  }
}

describe('addToCart', () => {
  it('adds a new product with quantity 1 and a snapshot', () => {
    const { dispatch, lines } = setup()

    dispatch(addToCart(product(1, { title: 'Backpack', priceCents: 10995, stock: 7 })))

    expect(lines()).toEqual([
      {
        productId: 1,
        quantity: 1,
        snapshot: {
          title: 'Backpack',
          image: 'https://fakestoreapi.com/img/1.png',
          priceCents: 10995,
          stock: 7,
        },
      },
    ])
  })

  it('adds one more when the product is already in the cart', () => {
    const { dispatch, qty } = setup()

    dispatch(addToCart(product(1)))
    dispatch(addToCart(product(1)))

    expect(qty(1)).toBe(2)
  })

  it('never goes above stock, however many times it is clicked', () => {
    const { dispatch, qty } = setup()

    for (let i = 0; i < 20; i++) dispatch(addToCart(product(1, { stock: 3 })))

    expect(qty(1)).toBe(3)
  })

  it('does nothing for an out-of-stock product', () => {
    const { dispatch, lines } = setup()

    dispatch(addToCart(product(11, { stock: 0 })))

    expect(lines()).toEqual([])
  })

  it('refreshes the snapshot from the latest product data', () => {
    const { dispatch, lines } = setup()

    dispatch(addToCart(product(1, { priceCents: 1000, stock: 5 })))
    dispatch(addToCart(product(1, { priceCents: 1200, stock: 5 })))

    expect(lines()[0]?.snapshot.priceCents).toBe(1200)
  })

  it('caps the quantity when fresher data shows lower stock', () => {
    const { dispatch, qty } = setup()

    for (let i = 0; i < 4; i++) dispatch(addToCart(product(1, { stock: 5 })))
    dispatch(addToCart(product(1, { stock: 2 })))

    expect(qty(1)).toBe(2)
  })

  it('removes the line when fresher data shows it is now out of stock', () => {
    const { dispatch, lines } = setup()

    dispatch(addToCart(product(1, { stock: 5 })))
    dispatch(addToCart(product(1, { stock: 0 })))

    expect(lines()).toEqual([])
  })

  it('keeps lines in the order they were added', () => {
    const { dispatch, lines } = setup()

    dispatch(addToCart(product(3)))
    dispatch(addToCart(product(1)))
    dispatch(addToCart(product(3)))

    expect(lines().map((line) => line.productId)).toEqual([3, 1])
  })
})

describe('increment and decrement', () => {
  it('increments up to stock and no further', () => {
    const { dispatch, qty } = setup()
    dispatch(addToCart(product(1, { stock: 2 })))

    dispatch(increment(1))
    dispatch(increment(1))

    expect(qty(1)).toBe(2)
  })

  it('decrements by one', () => {
    const { dispatch, qty } = setup()
    dispatch(addToCart(product(1)))
    dispatch(increment(1))

    dispatch(decrement(1))

    expect(qty(1)).toBe(1)
  })

  it('removes the line when decremented from 1', () => {
    const { dispatch, lines } = setup()
    dispatch(addToCart(product(1)))

    dispatch(decrement(1))

    expect(lines()).toEqual([])
  })

  it('ignores products that are not in the cart', () => {
    const { dispatch, lines } = setup()
    dispatch(addToCart(product(1)))
    const before = lines()

    dispatch(increment(99))
    dispatch(decrement(99))
    dispatch(removeFromCart(99))

    expect(lines()).toBe(before)
  })
})

describe('removeFromCart and clearCart', () => {
  it('removes one product and keeps the others', () => {
    const { dispatch, lines } = setup()
    dispatch(addToCart(product(1)))
    dispatch(addToCart(product(2)))

    dispatch(removeFromCart(1))

    expect(lines().map((line) => line.productId)).toEqual([2])
  })

  it('empties the cart', () => {
    const { dispatch, lines, count, subtotal } = setup()
    dispatch(addToCart(product(1)))
    dispatch(addToCart(product(2)))

    dispatch(clearCart())

    expect(lines()).toEqual([])
    expect(count()).toBe(0)
    expect(subtotal()).toBe(0)
  })
})

describe('selectors', () => {
  it('counts every unit, not just lines', () => {
    const { dispatch, count } = setup()
    dispatch(addToCart(product(1)))
    dispatch(addToCart(product(1)))
    dispatch(addToCart(product(2)))

    expect(count()).toBe(3)
  })

  it('totals in integer cents, with no floating-point drift', () => {
    const { dispatch, subtotal } = setup()
    // In dollars, 4.35 × 3 is 13.049999999999999 and 1.1 × 3 is 3.3000000000000003.
    // In cents both are exact: 435 × 3 = 1305 and 110 × 3 = 330.
    for (let i = 0; i < 3; i++) dispatch(addToCart(product(1, { priceCents: 435 })))
    for (let i = 0; i < 3; i++) dispatch(addToCart(product(2, { priceCents: 110 })))

    expect(subtotal()).toBe(1305 + 330)
  })

  it('returns 0 for a product not in the cart', () => {
    const { qty } = setup()
    expect(qty(42)).toBe(0)
  })

  it('returns the same result object when the cart has not changed', () => {
    const { store, dispatch } = setup()
    dispatch(addToCart(product(1)))

    const first = selectCartLines(store.getState())
    dispatch({ type: 'unrelated/action' })

    expect(selectCartLines(store.getState())).toBe(first)
  })
})

describe('applyCatalogStock', () => {
  it('lowers quantities above current stock and records which lines changed', () => {
    const { store, dispatch, qty } = setup()
    for (let i = 0; i < 4; i++) dispatch(addToCart(product(1, { stock: 5 })))
    dispatch(addToCart(product(2, { stock: 5 })))

    dispatch(applyCatalogStock([product(1, { stock: 2 }), product(2, { stock: 5 })]))

    expect(qty(1)).toBe(2)
    expect(qty(2)).toBe(1)
    expect(selectReducedIds(store.getState())).toEqual([1])
  })

  it('refreshes the saved stock so + respects the new limit', () => {
    const { dispatch, qty } = setup()
    dispatch(addToCart(product(1, { stock: 5 })))

    dispatch(applyCatalogStock([product(1, { stock: 1 })]))
    dispatch(increment(1))

    expect(qty(1)).toBe(1)
  })

  it('leaves out-of-stock and missing products unchanged (the page shows them as unavailable)', () => {
    const { dispatch, lines } = setup()
    dispatch(addToCart(product(1, { stock: 5 })))
    dispatch(addToCart(product(2, { stock: 5 })))
    const before = lines()

    dispatch(applyCatalogStock([product(1, { stock: 0 }), product(3, { stock: 9 })])) // 2 missing

    expect(lines()).toEqual(before)
  })
})
