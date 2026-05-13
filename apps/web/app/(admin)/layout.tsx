import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-[220px] min-h-screen bg-[#0A0A14] border-r border-dark-border flex flex-col">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-dark-border">
          <span className="font-display font-extrabold text-lg tracking-tight">
            <span className="text-cyan">GYM</span>FLOW
          </span>
          <span className="bg-orange/20 border border-orange/40 text-orange text-[9px] font-bold px-2 py-0.5 rounded-full">
            ADMIN
          </span>
        </div>
        <nav className="flex-1 py-4 flex flex-col gap-0.5">
          {[
            { href: '/admin',            label: 'Overview' },
            { href: '/admin/academias',  label: 'Academias' },
            { href: '/admin/receita',    label: 'Receita / MRR' },
            { href: '/admin/planos',     label: 'Planos SaaS' },
            { href: '/admin/suporte',    label: 'Suporte' },
            { href: '/admin/sistema',    label: 'Sistema' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center px-5 py-2.5 text-sm text-muted hover:text-white hover:bg-white/4 transition-all"
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
