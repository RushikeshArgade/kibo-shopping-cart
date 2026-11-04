import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

// min-h-11 = 44px touch target; focus ring only for keyboard focus (focus-visible).
const base =
  'inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

const variants: Record<Variant, string> = {
  primary: 'bg-slate-900 text-white hover:bg-slate-700',
  secondary: 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-100',
}

export function Button({ variant = 'primary', type = 'button', className, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={[base, variants[variant], className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}
