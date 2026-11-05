import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../test/render'
import { App } from './App'

describe('App shell', () => {
  it('links the brand home and gives the page its own h1', () => {
    renderWithProviders(<App />)

    expect(screen.getByRole('link', { name: 'Kibo Shop' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('heading', { level: 1, name: 'Products' })).toBeInTheDocument()
  })

  it('has a skip link to the main content', () => {
    renderWithProviders(<App />)

    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute('href', '#main')
  })
})

describe('Routing and page titles', () => {
  it('titles the products page', async () => {
    renderWithProviders(<App />)

    await waitFor(() => expect(document.title).toBe('Products · Kibo Shop'))
  })

  it('opens the cart from the header and retitles the page', async () => {
    renderWithProviders(<App />)

    await userEvent.click(screen.getByRole('link', { name: /^Cart,/ }))

    expect(screen.getByRole('heading', { level: 1, name: 'Your cart' })).toBeInTheDocument()
    await waitFor(() => expect(document.title).toBe('Your cart · Kibo Shop'))
  })

  it('shows a not-found page for an unknown URL, with a way back', async () => {
    renderWithProviders(<App />, { route: '/no-such-page' })

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to products' })).toHaveAttribute('href', '/')
    await waitFor(() => expect(document.title).toBe('Page not found · Kibo Shop'))
  })
})
