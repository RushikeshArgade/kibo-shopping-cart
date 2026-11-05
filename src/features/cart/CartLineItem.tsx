import { useId, type Ref } from 'react'
import { formatCents } from '../../shared/lib/money'
import { Button } from '../../shared/ui/Button'
import { QuantityStepper } from '../../shared/ui/QuantityStepper'
import type { LineStatus } from './reconcile'
import type { CartLine } from './types'

interface CartLineItemProps {
  line: CartLine
  status: LineStatus
  /** True when the quantity was just lowered to match current stock. */
  reduced: boolean
  /** The title receives focus when a neighbouring line is removed. */
  titleRef: Ref<HTMLHeadingElement>
  onIncrement: () => void
  onDecrement: () => void
  onRemove: () => void
}

const UNAVAILABLE_TEXT: Record<Exclude<LineStatus, 'ok'>, string> = {
  outOfStock: 'Out of stock',
  unavailable: 'No longer available',
}

export function CartLineItem({
  line,
  status,
  reduced,
  titleRef,
  onIncrement,
  onDecrement,
  onRemove,
}: CartLineItemProps) {
  const titleId = useId()
  const { title, image, priceCents, stock } = line.snapshot
  const available = status === 'ok'
  const atMax = line.quantity >= stock

  return (
    <article
      aria-labelledby={titleId}
      className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:gap-4"
    >
      {/* Decorative: the title right next to it already names the product. */}
      <img
        src={image}
        alt=""
        width={80}
        height={80}
        className={`size-20 shrink-0 object-contain ${available ? '' : 'opacity-40 grayscale'}`}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h2
          id={titleId}
          ref={titleRef}
          tabIndex={-1}
          className="line-clamp-2 rounded text-sm font-medium focus-visible:outline-2 focus-visible:outline-blue-700"
        >
          {title}
        </h2>
        <p className="text-sm text-slate-700">{formatCents(priceCents)} each</p>

        {available ? (
          <>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <QuantityStepper
                value={line.quantity}
                max={stock}
                label={title}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
              />
              <p className="font-semibold tabular-nums">
                {formatCents(line.quantity * priceCents)}
              </p>
            </div>
            {reduced ? (
              <p className="text-xs text-amber-800">Only {stock} left — quantity updated</p>
            ) : (
              atMax && <p className="text-xs text-slate-700">Max {stock} available</p>
            )}
          </>
        ) : (
          // Kept visible so the user sees what happened; not counted in the subtotal.
          <p className="text-sm font-medium text-red-700">{UNAVAILABLE_TEXT[status]}</p>
        )}

        <div>
          {/* Explicit label (same reason as Add to cart): one consistent name in every browser. */}
          <Button variant="secondary" onClick={onRemove} aria-label={`Remove ${title}`}>
            Remove
          </Button>
        </div>
      </div>
    </article>
  )
}
