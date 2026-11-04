export const LOW_STOCK_THRESHOLD = 3

export function stockLabel(stock: number): string {
  if (stock <= 0) return 'Out of stock'
  if (stock <= LOW_STOCK_THRESHOLD) return `Only ${stock} left`
  return 'In stock'
}
