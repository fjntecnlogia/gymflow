'use client'
import { forwardRef } from 'react'
import { Phone } from 'lucide-react'
import { mascaraTelefone } from '@/lib/masks'

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  error?: string
  value: string
  onChange: (valor: string, valorSemMascara: string) => void
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ label, error, value, onChange, className = '', ...rest }, ref) => {
    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const mascara = mascaraTelefone(e.target.value)
      const semMascara = mascara.replace(/\D/g, '')
      onChange(mascara, semMascara)
    }

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-xs font-bold uppercase tracking-widest text-muted">
            {label}
          </label>
        )}
        <div className="relative">
          <Phone
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            ref={ref}
            type="tel"
            inputMode="numeric"
            value={value}
            onChange={handleChange}
            placeholder="(XX) XXXXX-XXXX"
            maxLength={15}
            className={`w-full bg-dark-card border border-dark-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-cyan outline-none transition-colors ${error ? 'border-red' : ''} ${className}`}
            {...rest}
          />
        </div>
        {error && <p className="text-xs text-red">{error}</p>}
      </div>
    )
  },
)

PhoneInput.displayName = 'PhoneInput'
