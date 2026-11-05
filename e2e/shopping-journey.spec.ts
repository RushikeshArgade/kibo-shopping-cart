import { expect, test } from '@playwright/test'
import { BACKPACK, cartLink, mockApi, T_SHIRT } from './helpers.ts'

// The main user flow from the brief: browse → add to cart → adjust quantity → totals update.
test('browse, add to cart, change quantities and see the totals update', async ({ page }) => {
  await mockApi(page)
  await page.goto('/')

  // Browse: filter to men's clothing and sort by price.
  await expect(page.getByRole('article')).toHaveCount(5)
  await page.getByLabel('Category').selectOption("men's clothing")
  await page.getByLabel('Sort by').selectOption('price-asc')
  await expect(page.getByText('Showing 1–2 of 2 products')).toBeVisible()
  await expect(page.getByRole('article').first()).toContainText(T_SHIRT) // $22.30 first

  // Add to cart: the header count updates.
  await page.getByRole('button', { name: `Add to cart: ${BACKPACK}` }).click()
  await page.getByRole('button', { name: `Add to cart: ${T_SHIRT}` }).click()
  await expect(cartLink(page)).toHaveAccessibleName('Cart, 2 items')

  // Cart: $109.95 + $22.30
  await cartLink(page).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Your cart' })).toBeVisible()
  await expect(page.getByText('Subtotal (2 items)')).toBeVisible()
  await expect(page.getByText('$132.25')).toBeVisible()

  // One more backpack: 2 × $109.95 + $22.30
  await page.getByRole('button', { name: `Increase quantity of ${BACKPACK}` }).click()
  await expect(page.getByText('Subtotal (3 items)')).toBeVisible()
  await expect(page.getByText('$242.20')).toBeVisible()

  // T-shirt down from 1 removes the line: 2 × $109.95
  await page.getByRole('button', { name: `Decrease quantity of ${T_SHIRT}` }).click()
  await expect(page.getByRole('heading', { name: T_SHIRT })).toHaveCount(0)
  await expect(page.getByText('Subtotal (2 items)')).toBeVisible()
  await expect(page.getByText('$219.90').first()).toBeVisible()
  await expect(cartLink(page)).toHaveAccessibleName('Cart, 2 items')
})

test('shows an error when products fail to load, and recovers with Try again', async ({ page }) => {
  await mockApi(page, { productsStatus: 500 })
  await page.goto('/')

  await expect(page.getByRole('alert')).toHaveText("We couldn't load products.")

  await mockApi(page) // the server is back
  await page.getByRole('button', { name: 'Try again' }).click()

  await expect(page.getByRole('article')).toHaveCount(5)
  await expect(page.getByRole('alert')).toHaveCount(0)
})
