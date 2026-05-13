import { clsx } from 'clsx'

type Variant = 'active' | 'trial' | 'inactive' | 'danger' | 'info'

const styles: Record<Variant, string> = {
  active:   'bg-green/15 text-green border border-green/30',
  trial:    'bg-orange/15 text-orange border border-orange/30',
  inactive: 'bg-white/8 text-muted border border-dark-border',
  danger:   'bg-red/15 text-red border border-red/30',
  info:     'bg-cyan/15 text-cyan border border-cyan/30',
}

const labels: Record<string, Variant> = {
  ATIVO: 'active', TRIAL: 'trial', INADIMPLENTE: 'danger',
  SUSPENSO: 'trial', CANCELADO: 'inactive', LIBERADO: 'active', BLOQUEADO: 'danger',
}

interface BadgeProps { children: React.ReactNode; variant?: Variant; status?: string; className?: string }

export function Badge({ children, variant, status, className }: BadgeProps) {
  const v = variant ?? (status ? labels[status] ?? 'inactive' : 'inactive')
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', styles[v], className)}>
      {children}
    </span>
  )
}
