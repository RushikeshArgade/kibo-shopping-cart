import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from '../../app/App'
import { renderWithProviders } from '../../test/render'

async function renderShop() {
  renderWithProviders(<App />)
  await screen.findAllByRole('article')
}

const card = (title: RegExp) => within(screen.getByRole('article', { name: title }))
const addButton = (title: RegExp) => card(title).getByRole('button', { name: /^Add to cart/ })
const cartLink = () => screen.getByRole('link', { name: /^Cart,/ })
const announcer = () => screen.getByTestId('announcer')

describe('Add to cart', () => {
  it('starts with an empty cart in the header', async () => {
    await renderShop()

    expect(cartLink()).toHaveAccessibleName('Cart, 0 items')
    expect(cartLink()).toHaveAttribute('href', '/cart')
  })

  it('names each button after its product for screen readers', async () => {
    await renderShop()

    expect(addButton(/Fjallraven/)).toHaveAccessibleName(
      'Add to cart: Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops',
    )
  })

  it('updates the header count and the card when a product is added', async () => {
    await renderShop()

    await userEvent.click(addButton(/Fjallraven/))
    expect(cartLink()).toHaveAccessibleName('Cart, 1 item')
    expect(card(/Fjallraven/).getByText('1 in cart')).toBeInTheDocument()

    await userEvent.click(addButton(/Fjallraven/))
    await userEvent.click(addButton(/Mens Cotton|WD 2TB/))
    expect(cartLink()).toHaveAccessibleName('Cart, 3 items')
    expect(card(/Fjallraven/).getByText('2 in cart')).toBeInTheDocument()
  })

  it('announces each addition with the new cart count', async () => {
    await renderShop()

    await userEvent.click(addButton(/Fjallraven/))
    expect(announcer()).toHaveTextContent(
      'Added Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops to cart. 1 item in cart.',
    )

    await userEvent.click(addButton(/Fjallraven/))
    expect(announcer()).toHaveTextContent('2 items in cart.')
  })

  it('disables the button at the stock limit and says why', async () => {
    await renderShop()
    const tShirt = /Slim Fit T-Shirts/ // stock 3

    for (let i = 0; i < 3; i++) await userEvent.click(addButton(tShirt))

    expect(addButton(tShirt)).toBeDisabled()
    expect(card(tShirt).getByText('Max 3 in cart')).toBeInTheDocument()
    expect(cartLink()).toHaveAccessibleName('Cart, 3 items')
  })

  it('disables the button for an out-of-stock product', async () => {
    await renderShop()

    expect(addButton(/Silicon Power/)).toBeDisabled()
    expect(card(/Silicon Power/).getByText('Out of stock')).toBeInTheDocument()
  })
})
