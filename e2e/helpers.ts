import type { Page } from '@playwright/test'
import { apiCategories, apiProducts } from '../src/test/fixtures/products.ts'

/**
 * Serves the unit-test fixtures instead of fakestoreapi, so e2e runs are fast and don't
 * depend on a third-party API being up. Pass a status to simulate a failing products API.
 */
export async function mockApi(page: Page, { productsStatus = 200 } = {}) {
  await page.route('https://fakestoreapi.com/products/categories', (route) =>
    route.fulfill({ json: apiCategories }),
  )
  await page.route('https://fakestoreapi.com/products', (route) =>
    productsStatus === 200
      ? route.fulfill({ json: apiProducts })
      : route.fulfill({ status: productsStatus }),
  )
}

export const cartLink = (page: Page) => page.getByRole('link', { name: /^Cart,/ })

export const BACKPACK = 'Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops' // $109.95, stock 7
export const T_SHIRT = 'Mens Casual Premium Slim Fit T-Shirts' // $22.30, stock 3
