import { expect, test, type Page } from '@playwright/test'
import { apiCategories, apiProducts } from '../src/test/fixtures/products.ts'

// The API is mocked with the unit-test fixtures so the run doesn't depend on fakestoreapi.
async function mockApi(page: Page) {
  await page.route('https://fakestoreapi.com/products/categories', (route) =>
    route.fulfill({ json: apiCategories }),
  )
  await page.route('https://fakestoreapi.com/products', (route) =>
    route.fulfill({ json: apiProducts }),
  )
}

const BACKPACK = 'Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops'
const cartLink = (page: Page) => page.getByRole('link', { name: /^Cart,/ })

test('the cart survives a page reload', async ({ page }) => {
  await mockApi(page)
  await page.goto('/')
  await page.getByRole('button', { name: `Add to cart: ${BACKPACK}` }).click()
  await page.getByRole('button', { name: `Add to cart: ${BACKPACK}` }).click()
  await cartLink(page).click()

  await page.reload()

  await expect(page.getByRole('heading', { name: BACKPACK })).toBeVisible()
  await expect(page.getByText('Subtotal (2 items)')).toBeVisible()
  await expect(cartLink(page)).toHaveAccessibleName('Cart, 2 items')
})

test('a second tab sees cart changes made in the first', async ({ context }) => {
  const first = await context.newPage()
  const second = await context.newPage()
  await mockApi(first)
  await mockApi(second)
  await first.goto('/')
  await second.goto('/')

  await first.getByRole('button', { name: `Add to cart: ${BACKPACK}` }).click()

  await expect(cartLink(second)).toHaveAccessibleName('Cart, 1 item')
})
