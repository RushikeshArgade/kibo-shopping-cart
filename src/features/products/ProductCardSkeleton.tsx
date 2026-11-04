// Same shape as ProductCard, so the page doesn't jump when products arrive.
export function ProductCardSkeleton() {
  return (
    <div className="flex h-full animate-pulse flex-col rounded-lg border border-slate-200 p-3">
      <div className="aspect-square w-full rounded bg-slate-200" />
      <div className="mt-3 h-3 w-1/2 rounded bg-slate-200" />
      <div className="mt-2 h-4 w-full rounded bg-slate-200" />
      <div className="mt-1 h-4 w-3/4 rounded bg-slate-200" />
      <div className="mt-3 h-5 w-1/3 rounded bg-slate-200" />
    </div>
  )
}
