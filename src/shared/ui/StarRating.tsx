interface StarRatingProps {
  rate: number
  count: number
}

/** Compact rating: the star and numbers are visual; screen readers get one full sentence. */
export function StarRating({ rate, count }: StarRatingProps) {
  return (
    <p className="flex items-center gap-1 text-sm text-slate-700">
      <span aria-hidden="true" className="text-amber-500">
        ★
      </span>
      <span aria-hidden="true">
        {rate.toFixed(1)} ({count})
      </span>
      <span className="sr-only">
        Rated {rate} out of 5, {count} reviews
      </span>
    </p>
  )
}
