interface QuantityStepperProps {
  value: number
  max: number
  /** Product name, so each button's label says which product it changes. */
  label: string
  onIncrement: () => void
  onDecrement: () => void
}

const stepButton =
  'inline-flex size-11 items-center justify-center rounded-md border border-slate-300 bg-white text-lg ' +
  'hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

export function QuantityStepper({
  value,
  max,
  label,
  onIncrement,
  onDecrement,
}: QuantityStepperProps) {
  return (
    // A fieldset is the native group for related controls; screen readers announce the legend
    // when focus enters it. (Flex goes on an inner div: fieldset layout support is uneven.)
    <fieldset>
      <legend className="sr-only">Quantity of {label}</legend>
      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease quantity of ${label}`}
          onClick={onDecrement}
          className={stepButton}
        >
          −
        </button>
        <span className="min-w-6 text-center tabular-nums">{value}</span>
        <button
          type="button"
          aria-label={`Increase quantity of ${label}`}
          onClick={onIncrement}
          // Known trade-off: a focused button that disables itself drops keyboard focus to
          // <body>. Accepted for simplicity and documented in the README.
          disabled={value >= max}
          className={stepButton}
        >
          +
        </button>
      </div>
    </fieldset>
  )
}
