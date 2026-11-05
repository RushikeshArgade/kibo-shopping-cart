// zod/mini: same validation as `zod` with a tree-shakable functional API — 7.6 KB gzipped
// instead of 27 KB for these schemas (see docs/performance-notes.md).
import * as z from 'zod/mini'
import { toCents } from '../../shared/lib/money'
import { stockFor } from './inventory'
import type { Product } from './types'

const nonEmptyText = () => z.string().check(z.trim(), z.minLength(1))

// The API is untrusted input: every field is checked before it reaches the store.
export const apiProductSchema = z.object({
  id: z.int().check(z.positive()),
  title: nonEmptyText(),
  price: z.number().check(z.nonnegative()),
  description: z.string(),
  category: nonEmptyText(),
  // HTTPS only: blocks http (mixed content) and javascript:/data: URLs.
  image: z.url({ protocol: /^https$/ }),
  rating: z.object({
    rate: z.number().check(z.gte(0), z.lte(5)),
    count: z.int().check(z.nonnegative()),
  }),
})

export const categoriesSchema = z.array(nonEmptyText())

export class InvalidResponseError extends Error {
  override name = 'InvalidResponseError'
}

/**
 * Validates the products response. One bad product is dropped (with a warning) so it
 * can't take down the whole listing; a response that isn't a list, or where every
 * product is invalid, is treated as an error.
 */
export function parseProducts(data: unknown): Product[] {
  if (!Array.isArray(data)) {
    throw new InvalidResponseError('Products response is not a list')
  }

  const products: Product[] = []
  for (const item of data) {
    const result = apiProductSchema.safeParse(item)
    if (!result.success) {
      console.warn('Skipping invalid product', result.error.issues)
      continue
    }
    const { price, ...rest } = result.data
    products.push({ ...rest, priceCents: toCents(price), stock: stockFor(rest.id) })
  }

  if (data.length > 0 && products.length === 0) {
    throw new InvalidResponseError('No valid products in response')
  }
  return products
}

export function parseCategories(data: unknown): string[] {
  const result = categoriesSchema.safeParse(data)
  if (!result.success) {
    throw new InvalidResponseError('Categories response is invalid')
  }
  return result.data
}
