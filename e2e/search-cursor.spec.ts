import { expect, test } from '@playwright/test'
import { mockApi } from './helpers.ts'

// Guards the `useTransitions={false}` fix in main.tsx: the search box reads its value from the
// URL, and with transitions on, editing mid-word made the cursor jump to the end.
test('editing a search in the middle keeps the cursor in place', async ({ page }) => {
  await mockApi(page)
  await page.goto('/')
  const search = page.getByLabel('Search products')

  await search.pressSequentially('mens casual premium')
  for (let i = 0; i < 8; i++) await search.press('ArrowLeft') // just after "casual"
  await search.pressSequentially('XY')

  await expect(search).toHaveValue('mens casualXY premium')
  expect(await search.evaluate((input: HTMLInputElement) => input.selectionStart)).toBe(13)
})
