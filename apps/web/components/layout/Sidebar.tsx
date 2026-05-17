'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard, Users, ShieldCheck, DollarSign,
  Calendar, BarChart2, Bell, Settings, LogOut, Package, Cpu, Camera,
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  'https://gfxjehsjwwtlrhcjvkfr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmeGplaHNqd3d0bHJoY2p2a2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MTkzNzgsImV4cCI6MjA5NDI5NTM3OH0.6CF-JQYynO84ZUfn2iHmhLc3U-g7xc2jAXuga38FftI'
)

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/alunos', label: 'Alunos', icon: Users },
  { href: '/planos', label: 'Planos', icon: Package },
  { href: '/acesso', label: 'Controle Acesso', icon: ShieldCheck },
  { href: '/catracas', label: 'Catracas', icon: Cpu },
  { href: '/biometria', label: 'Biometria', icon: Camera },
  { href: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { href: '/agenda', label: 'Agenda', icon: Calendar },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart2 },
  { href: '/notificacoes', label: 'Notificações', icon: Bell },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    localStorage.removeItem('gymflow_token')
    router.push('/login')
  }

  return (
    <aside className="w-[220px] min-h-screen bg-[#0D0D1A] border-r border-dark-border flex flex-col">
      <div className="h-16 flex items-center px-5 border-b border-dark-border">
        <span className="font-display font-extrabold text-lg tracking-tight">
          <span className="text-cyan">GYM</span>FLOW
        </span>
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-5 py-2.5 text-sm transition-all duration-150 border-r-2',
                active
                  ? 'text-cyan bg-cyan/8 border-cyan'
                  : 'text-muted hover:text-white hover:bg-white/4 border-transparent',
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-dark-border p-4">
        <button onClick={handleLogout} className="flex items-center gap-3 text-sm text-muted hover:text-red transition-colors w-full px-1 py-2">
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}
