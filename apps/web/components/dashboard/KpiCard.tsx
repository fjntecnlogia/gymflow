import { clsx } from 'clsx'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: string | number
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
  color?: 'cyan' | 'green' | 'orange' | 'red' | 'white'
  icon?: React.ReactNode
  highlight?: boolean
}

const colorMap = {
  cyan: 'text-cyan', green: 'text-green', orange: 'text-orange',
  red: 'text-red', white: 'text-white',
}

export function KpiCard({ label, value, change, changeType = 'neutral', color = 'white', icon, highlight }: KpiCardProps) {
  return (
    <div className={clsx(
      'card p-4 flex flex-col gap-1',
      highlight && 'border-cyan/40 bg-cyan/5',
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-muted">{label}</span>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <span className={clsx('font-display text-2xl font-extrabold', colorMap[color])}>{value}</span>
      {change && (
        <span className={clsx('flex items-center gap-1 text-xs font-semibold',
          changeType === 'up' ? 'text-green' : changeType === 'down' ? 'text-red' : 'text-muted',
        )}>
          {changeType === 'up' && <TrendingUp size={12} />}
          {changeType === 'down' && <TrendingDown size={12} />}
          {change}
        </span>
      )}
    </div>
  )
}
