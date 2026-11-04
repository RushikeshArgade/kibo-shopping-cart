// All money in the app is integer cents. Floats only exist at the API boundary
// (toCents) and are turned back into text only for display (formatCents).

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

/** Converts a dollar amount from the API to integer cents, e.g. 19.99 → 1999. */
export function toCents(dollars: number): number {
  if (!Number.isFinite(dollars)) {
    throw new RangeError(`Invalid dollar amount: ${dollars}`)
  }
  // 19.99 * 100 is 1998.9999… in floating point, so round to the nearest cent.
  return Math.round(dollars * 100)
}

/** Formats integer cents for display, e.g. 98500 → "$985.00". */
export function formatCents(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new RangeError(`Cents must be an integer: ${cents}`)
  }
  return usd.format(cents / 100)
}
