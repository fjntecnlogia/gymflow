'use client'
import { MessageCircle, Mail, Phone, Clock } from 'lucide-react'

export default function AdminSuportePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Suporte</h1>
        <p className="text-muted text-sm">Central de suporte das academias clientes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: MessageCircle, label: 'WhatsApp Suporte', value: 'Em breve', color: 'text-green' },
          { icon: Mail, label: 'E-mail médio de resposta', value: '< 24h', color: 'text-cyan' },
          { icon: Clock, label: 'Tickets abertos', value: '0', color: 'text-muted' },
        ].map(k => (
          <div key={k.label} className="card p-5">
            <k.icon size={18} className={k.color + ' mb-2'} />
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-sm text-muted">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="card p-6 text-center">
        <MessageCircle size={40} className="mx-auto text-muted mb-4 opacity-30" />
        <p className="text-muted">Sistema de tickets em desenvolvimento.</p>
        <p className="text-sm text-muted mt-1">Por enquanto, suporte via WhatsApp e e-mail direto.</p>
      </div>
    </div>
  )
}
