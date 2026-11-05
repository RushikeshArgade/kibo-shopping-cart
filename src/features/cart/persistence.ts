import { z } from 'zod'
import type { CartLine } from './types'

export const CART_STORAGE_KEY = 'kibo-cart'
const CART_VERSION = 1

// What's read back from localStorage is untrusted (old versions, manual edits, other code):
// it's validated with the same care as API data before it reaches the store.
const savedCartSchema = z.object({
  version: z.literal(CART_VERSION),
  lines: z.array(
    z
      .object({
        productId: z.int().positive(),
        quantity: z.int().positive(),
        snapshot: z.object({
          title: z.string().min(1),
          image: z.url({ protocol: /^https$/ }),
          priceCents: z.int().nonnegative(),
          stock: z.int().nonnegative(),
        }),
      })
      .refine((line) => line.quantity <= line.snapshot.stock),
  ),
})

/** Parses a saved cart. Anything missing, corrupted or from another version gives an empty cart. */
export function parseSavedCart(raw: string | null): CartLine[] {
  if (!raw) return []
  try {
    const result = savedCartSchema.safeParse(JSON.parse(raw))
    return result.success ? result.data.lines : []
  } catch {
    return [] // not valid JSON
  }
}

export function loadCart(): CartLine[] {
  try {
    return parseSavedCart(localStorage.getItem(CART_STORAGE_KEY))
  } catch {
    return [] // storage blocked (some private modes) or unavailable
  }
}

export function saveCart(lines: CartLine[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: CART_VERSION, lines }))
  } catch {
    // Storage full, blocked or unavailable: the cart keeps working in memory for this visit.
  }
}
