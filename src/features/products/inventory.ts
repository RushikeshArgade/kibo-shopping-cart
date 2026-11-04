/**
 * Fake stock, because the API has none. Deterministic so it's the same on every load
 * and in tests, and works for any catalog size. Gives 0–10: for ids 1–20, product 11
 * is out of stock and several are low (1–3). Real stock would come from the server.
 */
export function stockFor(productId: number): number {
  return (productId * 7) % 11
}
