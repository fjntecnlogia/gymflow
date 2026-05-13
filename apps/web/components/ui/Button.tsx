'use client'
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: React.ReactNode
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'gradient-btn text-dark font-bold shadow-glow hover:shadow-glow',
  secondary: 'bg-orange text-white hover:bg-orange-dark',
  outline: 'bg-transparent border border-dark-border text-white hover:border-cyan hover:text-cyan',
  ghost: 'bg-transparent text-muted hover:text-white hover:bg-dark-card2',
  danger: 'bg-red text-white hover:bg-red-dark',
}

const sizes: Record<Size, string> = {
  xs: 'px-3 py-1.5 text-xs rounded-md',
  sm: 'px-4 py-2 text-sm rounded-md',
  md: 'px-5 py-2.5 text-sm rounded-lg',
  lg: 'px-7 py-3.5 text-base rounded-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, fullWidth, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan focus:ring-offset-2 focus:ring-offset-dark disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : leftIcon}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'
