import type { Product } from '../products'
import type { CartLine } from './types'

export type LineStatus = 'ok' | 'outOfStock' | 'unavailable'

export interface ReconciledLine {
  line: CartLine
  status: LineStatus
}

/**
 * Compares saved cart lines with the latest catalog. Out-of-stock and missing products stay in
 * the cart (the user sees what happened and can remove them) but don't count towards the
 * subtotal. Without catalog data (still loading, or failed) every line is treated as available.
 */
export function reconcile(lines: CartLine[], products: Product[] | undefined) {
  const byId = new Map(products?.map((product) => [product.id, product]))

  const reconciled: ReconciledLine[] = lines.map((line) => {
    if (!products) return { line, status: 'ok' }
    const product = byId.get(line.productId)
    if (!product) return { line, status: 'unavailable' }
    if (product.stock <= 0) return { line, status: 'outOfStock' }
    return { line, status: 'ok' }
  })

  const available = reconciled.filter((item) => item.status === 'ok').map((item) => item.line)

  return {
    lines: reconciled,
    subtotalCents: available.reduce((sum, l) => sum + l.quantity * l.snapshot.priceCents, 0),
    availableCount: available.reduce((count, l) => count + l.quantity, 0),
    unavailableCount: reconciled.length - available.length,
  }
}

/** Lines whose quantity is above the product's current (non-zero) stock. */
export function linesOverStock(lines: CartLine[], products: Product[]) {
  const byId = new Map(products.map((product) => [product.id, product]))
  return lines.filter((line) => {
    const stock = byId.get(line.productId)?.stock ?? 0
    return stock > 0 && line.quantity > stock
  })
}
