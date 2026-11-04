import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import { apiProducts } from '../../test/fixtures/products'
import { categoriesUrl, productsUrl } from '../../test/handlers'
import { renderWithProviders } from '../../test/render'
import { server } from '../../test/server'
import { ProductsPage } from './ProductsPage'

/** Shows the current query string so tests can assert what the URL holds. */
function LocationDisplay() {
  return <output data-testid="location">{useLocation().search}</output>
}

function renderPage(route = '/') {
  return renderWithProviders(
    <>
      <ProductsPage />
      <LocationDisplay />
    </>,
    { route },
  )
}

const url = () => new URLSearchParams(screen.getByTestId('location').textContent ?? '')
const summary = () => screen.getByText(/^Showing|^No products match/)
const titles = () =>
  screen.getAllByRole('article').map((card) => within(card).getByRole('heading').textContent)

/** 20 products: odd ids are electronics, even ids jewelery. */
function serveTwentyProducts() {
  const template = apiProducts[0]!
  const twenty = Array.from({ length: 20 }, (_, i) => ({
    ...template,
    id: i + 1,
    title: `Item ${String(i + 1).padStart(2, '0')}`,
    category: i % 2 === 0 ? 'electronics' : 'jewelery',
  }))
  server.use(http.get(productsUrl, () => HttpResponse.json(twenty)))
}

describe('ProductsPage — filter, search, sort', () => {
  it('applies category and sort from a shared link', async () => {
    renderPage('/?category=electronics&sort=price-asc')

    await screen.findAllByRole('article')
    expect(summary()).toHaveTextContent('Showing 1–2 of 2 products')
    expect(titles()).toEqual([
      'WD 2TB Elements Portable External Hard Drive - USB 3.0',
      'Silicon Power 256GB SSD 3D NAND A55 SLC Cache Performance Boost SATA III 2.5',
    ])
    expect(await screen.findByLabelText('Category')).toHaveValue('electronics')
    expect(screen.getByLabelText('Sort by')).toHaveValue('price-asc')
  })

  it('filters as you type and keeps the search in the URL', async () => {
    renderPage()
    await screen.findAllByRole('article')

    await userEvent.type(screen.getByLabelText('Search products'), 'ssd')

    expect(titles()).toEqual([expect.stringContaining('SSD')])
    expect(url().get('q')).toBe('ssd')
  })

  it('reorders products when the sort changes', async () => {
    renderPage()
    await screen.findAllByRole('article')

    await userEvent.selectOptions(screen.getByLabelText('Sort by'), 'Price: low to high')

    expect(titles()[0]).toBe('Mens Casual Premium Slim Fit T-Shirts') // $22.30, the cheapest
    expect(url().get('sort')).toBe('price-asc')
  })

  it('shows a no-match message and clears all filters', async () => {
    renderPage('/?category=electronics&sort=name-asc')
    await screen.findAllByRole('article')

    await userEvent.type(screen.getByLabelText('Search products'), 'unicorn')
    expect(summary()).toHaveTextContent('No products match your filters.')

    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(screen.getAllByRole('article')).toHaveLength(apiProducts.length)
    expect(url().toString()).toBe('')
    expect(screen.getByLabelText('Search products')).toHaveValue('')
  })

  it('keeps an unknown category from an old link selectable', async () => {
    renderPage('/?category=toys')

    expect(await screen.findByText('No products match your filters.')).toBeInTheDocument()
    expect(await screen.findByLabelText('Category')).toHaveValue('toys')
  })

  it('hides the category filter if categories fail to load, but still lists products', async () => {
    server.use(http.get(categoriesUrl, () => new HttpResponse(null, { status: 500 })))
    renderPage()

    expect(await screen.findAllByRole('article')).toHaveLength(apiProducts.length)
    await waitFor(() => expect(screen.queryByLabelText('Category')).not.toBeInTheDocument(), {
      timeout: 3000,
    })
    expect(screen.getByLabelText('Search products')).toBeInTheDocument()
  })
})

describe('ProductsPage — pagination', () => {
  it('shows 12 per page and moves between pages with links', async () => {
    serveTwentyProducts()
    renderPage()
    await screen.findAllByRole('article')

    expect(summary()).toHaveTextContent('Showing 1–12 of 20 products')
    const pagination = screen.getByRole('navigation', { name: 'Pagination' })
    expect(within(pagination).getByRole('link', { name: 'Page 1' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await userEvent.click(within(pagination).getByRole('link', { name: 'Next' }))

    expect(summary()).toHaveTextContent('Showing 13–20 of 20 products')
    expect(screen.getAllByRole('article')).toHaveLength(8)
    expect(url().get('page')).toBe('2')
    expect(
      within(screen.getByRole('navigation', { name: 'Pagination' })).getByRole('link', {
        name: 'Page 2',
      }),
    ).toHaveAttribute('aria-current', 'page')
  })

  it('moves focus to the results summary after changing page', async () => {
    serveTwentyProducts()
    renderPage()
    await screen.findAllByRole('article')

    await userEvent.click(screen.getByRole('link', { name: 'Page 2' }))

    expect(summary()).toHaveFocus()
  })

  it('goes back to page 1 when a filter changes', async () => {
    serveTwentyProducts()
    renderPage('/?page=2')
    await screen.findAllByRole('article')

    await userEvent.selectOptions(await screen.findByLabelText('Category'), 'electronics')

    expect(url().get('page')).toBeNull()
    expect(summary()).toHaveTextContent('Showing 1–10 of 10 products')
  })

  it('hides pagination when everything fits on one page', async () => {
    renderPage()
    await screen.findAllByRole('article')

    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument()
  })
})
