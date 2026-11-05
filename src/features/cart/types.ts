/**
 * One product in the cart. The snapshot keeps what's needed to show the line even if the
 * product later disappears from the catalog; stock is refreshed from the catalog (step 8).
 */
export interface CartLine {
  productId: number
  /** Always between 1 and snapshot.stock. */
  quantity: number
  snapshot: {
    title: string
    image: string
    priceCents: number
    stock: number
  }
}
