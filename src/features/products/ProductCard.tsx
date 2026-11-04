import { useId } from 'react'
import { formatCents } from '../../shared/lib/money'
import { StarRating } from '../../shared/ui/StarRating'
import { LOW_STOCK_THRESHOLD, stockLabel } from './stockLabel'
import type { Product } from './types'

// Colour is a hint only — the text always says the stock state. All three pass AA on white.
function stockTone(stock: number) {
  if (stock <= 0) return 'text-red-700'
  if (stock <= LOW_STOCK_THRESHOLD) return 'text-amber-800'
  return 'text-green-700'
}

export function ProductCard({ product }: { product: Product }) {
  const titleId = useId()
  const { title, image, category, rating, priceCents, stock } = product

  return (
    <article
      aria-labelledby={titleId}
      className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-3"
    >
      {/* Fixed size + aspect box: no layout shift while the image loads. */}
      <img
        src={image}
        alt={title}
        width={300}
        height={300}
        loading="lazy"
        className="aspect-square w-full object-contain"
      />
      <p className="mt-3 text-xs text-slate-600">{category}</p>
      {/* Clamped visually to 2 lines; the full title stays in the DOM for screen readers. */}
      <h2 id={titleId} className="mt-1 line-clamp-2 text-sm font-medium" title={title}>
        {title}
      </h2>
      <div className="mt-1">
        <StarRating rate={rating.rate} count={rating.count} />
      </div>
      <p className="mt-auto pt-2 text-base font-semibold">{formatCents(priceCents)}</p>
      <p className={`text-sm ${stockTone(stock)}`}>{stockLabel(stock)}</p>
    </article>
  )
}
