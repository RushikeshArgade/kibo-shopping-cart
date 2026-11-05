import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { makeStore } from '../../app/store'
import { renderWithProviders } from '../../test/render'
import type { Product } from '../products'
import { addToCart } from './cartSlice'
import { CartPage } from './CartPage'

function product(id: number, title: string, priceCents: number, stock = 5): Product {
  return {
    id,
    title,
    priceCents,
    stock,
    description: '',
    category: 'electronics',
    image: `https://fakestoreapi.com/img/${id}.png`,
    rating: { rate: 4, count: 10 },
  }
}

const backpack = product(1, 'Backpack', 10995)
const shirt = product(2, 'Shirt', 2230, 3)
const ring = product(3, 'Ring', 695)

/** Renders the cart page with the given products added (repeat a product to add it twice). */
function renderCart(...products: Product[]) {
  const store = makeStore()
  for (const p of products) store.dispatch(addToCart(p))
  renderWithProviders(<CartPage />, { store, route: '/cart' })
}

const line = (name: string) => within(screen.getByRole('article', { name }))
const subtotal = () => screen.getByText(/^Subtotal/).nextElementSibling
const announcer = () => screen.getByTestId('announcer')

describe('CartPage', () => {
  it('shows each line with unit price, quantity and line total', () => {
    renderCart(backpack, backpack, shirt)

    expect(line('Backpack').getByText('$109.95 each')).toBeInTheDocument()
    expect(line('Backpack').getByText('$219.90')).toBeInTheDocument()
    expect(line('Shirt').getByText('$22.30')).toBeInTheDocument()
  })

  it('shows the subtotal and item count', () => {
    renderCart(backpack, backpack, shirt)

    expect(screen.getByText('Subtotal (3 items)')).toBeInTheDocument()
    expect(subtotal()).toHaveTextContent('$242.20')
  })

  it('increases the quantity and updates the totals', async () => {
    renderCart(ring)

    await userEvent.click(screen.getByRole('button', { name: 'Increase quantity of Ring' }))

    expect(line('Ring').getByText('$13.90')).toBeInTheDocument()
    expect(subtotal()).toHaveTextContent('$13.90')
    expect(announcer()).toHaveTextContent('Ring: quantity 2.')
  })

  it('disables + at the stock limit and shows the limit', async () => {
    renderCart(shirt) // stock 3
    const plus = screen.getByRole('button', { name: 'Increase quantity of Shirt' })

    await userEvent.click(plus)
    await userEvent.click(plus)

    expect(plus).toBeDisabled()
    expect(line('Shirt').getByText('Max 3 available')).toBeInTheDocument()
  })

  it('decreases the quantity', async () => {
    renderCart(ring, ring)

    await userEvent.click(screen.getByRole('button', { name: 'Decrease quantity of Ring' }))

    expect(screen.getByText('Subtotal (1 item)')).toBeInTheDocument()
    expect(announcer()).toHaveTextContent('Ring: quantity 1.')
  })

  it('removes the line when decreased from 1, and announces it', async () => {
    renderCart(ring, backpack)

    await userEvent.click(screen.getByRole('button', { name: 'Decrease quantity of Ring' }))

    expect(screen.queryByRole('article', { name: 'Ring' })).not.toBeInTheDocument()
    expect(announcer()).toHaveTextContent('Removed Ring from cart.')
  })

  it('removes a line with the Remove button', async () => {
    renderCart(ring, backpack)

    await userEvent.click(screen.getByRole('button', { name: 'Remove Ring' }))

    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(subtotal()).toHaveTextContent('$109.95')
  })

  it('shows an empty state with a link back to products', () => {
    renderCart()

    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Browse products' })).toHaveAttribute('href', '/')
  })
})

describe('CartPage — focus after removing a line', () => {
  it('moves focus to the next line', async () => {
    renderCart(backpack, shirt, ring)

    await userEvent.click(screen.getByRole('button', { name: 'Remove Shirt' }))

    expect(screen.getByRole('heading', { name: 'Ring' })).toHaveFocus()
  })

  it('moves focus to the previous line when the last line is removed', async () => {
    renderCart(backpack, shirt)

    await userEvent.click(screen.getByRole('button', { name: 'Remove Shirt' }))

    expect(screen.getByRole('heading', { name: 'Backpack' })).toHaveFocus()
  })

  it('moves focus to the page heading when the cart becomes empty', async () => {
    renderCart(ring)

    await userEvent.click(screen.getByRole('button', { name: 'Decrease quantity of Ring' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Your cart' })).toHaveFocus()
  })
})
