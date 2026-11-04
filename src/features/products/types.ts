/** A product as the app uses it: validated, priced in cents, with stock attached. */
export interface Product {
  id: number
  title: string
  priceCents: number
  description: string
  category: string
  image: string
  rating: { rate: number; count: number }
  stock: number
}
