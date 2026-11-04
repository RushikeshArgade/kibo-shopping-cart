import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { apiProducts } from '../../test/fixtures/products'
import { productsUrl } from '../../test/handlers'
import { renderWithProviders } from '../../test/render'
import { server } from '../../test/server'
import { ProductList } from './ProductList'

// Retry backoff can take up to ~1s before the error state appears.
const RETRY_WAIT = { timeout: 3000 }

function card(title: RegExp) {
  return within(screen.getByRole('article', { name: title }))
}

describe('ProductList', () => {
  it('shows a loading state, then the products', async () => {
    renderWithProviders(<ProductList />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading products')
    expect(await screen.findAllByRole('article')).toHaveLength(apiProducts.length)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows image, title, price, category, rating and stock on each card', async () => {
    renderWithProviders(<ProductList />)
    await screen.findAllByRole('article')

    const backpack = card(/Fjallraven/)
    expect(backpack.getByRole('img', { name: /Fjallraven/ })).toBeInTheDocument()
    expect(backpack.getByRole('heading', { name: /Fjallraven/ })).toBeInTheDocument()
    expect(backpack.getByText('$109.95')).toBeInTheDocument()
    expect(backpack.getByText("men's clothing")).toBeInTheDocument()
    expect(backpack.getByText('Rated 3.9 out of 5, 120 reviews')).toBeInTheDocument()
    expect(backpack.getByText('In stock')).toBeInTheDocument()
  })

  it('shows out-of-stock and low-stock products', async () => {
    renderWithProviders(<ProductList />)
    await screen.findAllByRole('article')

    expect(card(/Silicon Power/).getByText('Out of stock')).toBeInTheDocument()
    expect(card(/Slim Fit T-Shirts/).getByText('Only 3 left')).toBeInTheDocument()
  })

  it('gives every product image its title as alt text', async () => {
    renderWithProviders(<ProductList />)

    const images = await screen.findAllByRole('img')
    expect(images.map((img) => img.getAttribute('alt'))).toEqual(apiProducts.map((p) => p.title))
  })

  it('shows an empty message when there are no products', async () => {
    server.use(http.get(productsUrl, () => HttpResponse.json([])))
    renderWithProviders(<ProductList />)

    expect(await screen.findByText('No products available right now.')).toBeInTheDocument()
  })

  it('shows an error with a retry that recovers once the server is back', async () => {
    server.use(http.get(productsUrl, () => new HttpResponse(null, { status: 500 })))
    renderWithProviders(<ProductList />)

    expect(await screen.findByRole('alert', {}, RETRY_WAIT)).toHaveTextContent(
      "We couldn't load products.",
    )

    server.resetHandlers() // server recovers
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findAllByRole('article', {}, RETRY_WAIT)).toHaveLength(apiProducts.length)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
