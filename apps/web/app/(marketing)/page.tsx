import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-dark text-white">
      <nav className="border-b border-dark-border px-6 py-4 flex items-center justify-between sticky top-0 bg-dark/95 backdrop-blur z-50">
        <span className="font-display font-extrabold text-xl"><span className="text-cyan">GYM</span>FLOW</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-muted hover:text-white transition-colors">Entrar</Link>
          <Link href="/cadastro" className="gradient-btn text-dark font-bold text-sm px-4 py-2 rounded-lg">Testar grátis</Link>
        </div>
      </nav>

      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-cyan/10 border border-cyan/30 rounded-full px-4 py-1.5 text-xs font-bold text-cyan tracking-widest uppercase mb-8">
          🚀 Novo · GYMFLOW v1.0
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
          Sua academia<br />
          <span className="gradient-text">perdendo dinheiro</span><br />
          no WhatsApp.
        </h1>
        <p className="text-muted text-lg max-w-xl mx-auto mb-10">
          GYMFLOW automatiza o controle de acesso, as cobranças e os alunos — para você parar de apagar incêndio e começar a crescer.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/cadastro" className="gradient-btn text-dark font-bold text-base px-8 py-4 rounded-xl">
            Testar grátis por 14 dias →
          </Link>
          <Link href="#demo" className="border border-dark-border text-white text-base px-8 py-4 rounded-xl hover:border-muted transition-colors">
            Ver demonstração
          </Link>
        </div>
        <p className="text-xs text-muted mt-4">Sem cartão de crédito · Cancela quando quiser · Funciona em 24h</p>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '🔐', title: 'Controle de Acesso', desc: 'Catraca liberada para quem pagou. Bloqueada para quem não pagou. QR Code + biometria facial.' },
            { icon: '💰', title: 'Cobranças Automáticas', desc: 'PIX com link automático, cartão recorrente. A régua de cobrança dispara no WhatsApp no dia certo.' },
            { icon: '📱', title: 'App para Alunos', desc: 'App iOS e Android com QR Code de acesso, histórico de check-ins e renovação online.' },
            { icon: '📊', title: 'Dashboard em Tempo Real', desc: 'Veja quem está na academia agora, picos de movimento, retenção e receita do mês.' },
            { icon: '📲', title: 'WhatsApp Automático', desc: '"Seu plano vence em 3 dias." "Pagamento confirmado." Mensagens automáticas sem digitar nada.' },
            { icon: '☁️', title: '100% na Nuvem', desc: 'Acesse de qualquer dispositivo. Backup automático e 99.9% de uptime garantido.' },
          ].map((f) => (
            <div key={f.title} className="card p-6">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-base mb-2">{f.title}</h3>
              <p className="text-sm text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-24 text-center">
        <h2 className="font-display text-3xl font-bold mb-2">Escolha seu plano</h2>
        <p className="text-muted mb-10">14 dias grátis em todos os planos. Sem cartão agora.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { nome: 'Starter', preco: '197', desc: 'Até 100 alunos', items: ['QR Code acesso', 'App alunos', 'PIX automático', 'WhatsApp', 'Suporte email'], featured: false },
            { nome: 'Pro', preco: '397', desc: 'Até 500 alunos', items: ['Tudo do Starter', 'Biometria facial', 'Relatórios avançados', 'Cartão recorrente', 'Suporte WhatsApp'], featured: true },
            { nome: 'Enterprise', preco: '797', desc: 'Ilimitado', items: ['Tudo do Pro', 'Multi-unidades', 'API pública', 'White-label', 'Gerente de conta'], featured: false },
          ].map((p) => (
            <div key={p.nome} className={`rounded-2xl p-8 relative ${p.featured ? 'border-2 border-cyan bg-cyan/5' : 'card'}`}>
              {p.featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan text-dark text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">Mais popular</div>}
              <div className="text-xs font-bold uppercase tracking-widest text-muted mb-2">{p.nome}</div>
              <div className="font-display text-4xl font-black mb-1"><sup className="text-xl">R$</sup>{p.preco}<small className="text-base font-normal text-muted">/mês</small></div>
              <div className="text-xs text-muted mb-6">{p.desc}</div>
              <ul className="space-y-2 mb-6 text-left">
                {p.items.map((i) => <li key={i} className="text-sm text-muted flex gap-2"><span className="text-cyan">✓</span>{i}</li>)}
              </ul>
              <Link href="/cadastro" className={`w-full block text-center py-3 rounded-xl font-bold text-sm ${p.featured ? 'gradient-btn text-dark' : 'border border-dark-border hover:border-muted text-white transition-colors'}`}>
                Começar grátis
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-dark-border py-8 text-center text-xs text-muted">
        <span className="font-display font-bold text-base"><span className="text-cyan">GYM</span>FLOW</span>
        <p className="mt-2">© 2026 GYMFLOW · Sua academia. Sob controle.</p>
      </footer>
    </main>
  )
}
