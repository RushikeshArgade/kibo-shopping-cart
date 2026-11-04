import { screen } from '@testing-library/react'
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
