'use client'
import { InputHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, leftIcon, rightIcon, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-600 text-muted uppercase tracking-widest">{label}</label>}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">{leftIcon}</span>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full bg-dark-card border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted outline-none transition-all duration-200',
            'focus:border-cyan focus:bg-dark-card2',
            error ? 'border-red' : 'border-dark-border hover:border-muted',
            leftIcon && 'pl-9',
            rightIcon && 'pr-10',
            className,
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-muted">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <span className="text-xs text-red">{error}</span>}
      {helper && !error && <span className="text-xs text-muted">{helper}</span>}
    </div>
  ),
)
Input.displayName = 'Input'
