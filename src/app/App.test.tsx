import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../test/render'
import { App } from './App'

describe('App shell', () => {
  it('renders the site heading and a skip link to main content', () => {
    renderWithProviders(<App />)

    expect(screen.getByRole('heading', { level: 1, name: /kibo shop/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute('href', '#main')
  })
})
