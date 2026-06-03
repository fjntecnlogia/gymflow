import Link from 'next/link'
import type { Metadata } from 'next'
import {
  Fingerprint,
  CreditCard,
  Smartphone,
  BarChart3,
  MessageCircle,
  Cloud,
  Check,
  X,
  ChevronDown,
  Shield,
  Zap,
  Clock,
  TrendingUp,
  Users,
  Mail,
  Phone,
  ArrowRight,
  Sparkles,
  QrCode,
  Activity,
} from 'lucide-react'

const SITE_URL = 'https://gymflowgestor.com.br'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'GymFlow Gestor — Sua academia. Sob controle.',
  description:
    'Pare de perder dinheiro no WhatsApp. Controle de acesso, cobrança automática e app para alunos em uma única plataforma. Agende uma demonstração personalizada.',
  keywords: [
    'gestão de academia',
    'software para academia',
    'controle de acesso academia',
    'catraca academia',
    'biometria facial academia',
    'cobrança automática academia',
    'app para alunos',
    'GymFlow',
  ],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: SITE_URL,
    siteName: 'GymFlow Gestor',
    title: 'GymFlow Gestor — Sua academia. Sob controle.',
    description:
      'Controle de acesso, cobrança automática no PIX e app para alunos. Agende uma demonstração de 30 minutos com nosso time.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GymFlow Gestor — Sua academia. Sob controle.',
    description:
      'Controle de acesso, cobrança automática no PIX e app para alunos. Agende uma demonstração de 30 minutos com nosso time.',
  },
  alternates: { canonical: SITE_URL },
}

const features = [
  {
    Icon: Fingerprint,
    title: 'Controle de Acesso',
    desc: 'Catraca liberada para quem pagou. Bloqueada para quem não pagou. QR Code + biometria facial em < 0,3s.',
  },
  {
    Icon: CreditCard,
    title: 'Cobranças Automáticas',
    desc: 'PIX com link automático e cartão recorrente. A régua de cobrança dispara no WhatsApp no dia certo.',
  },
  {
    Icon: Smartphone,
    title: 'App para Alunos',
    desc: 'App iOS e Android com QR de acesso, histórico de check-ins, renovação online e treinos.',
  },
  {
    Icon: BarChart3,
    title: 'Dashboard em Tempo Real',
    desc: 'Quem está na academia agora, picos de movimento, retenção e receita do mês — sem planilha.',
  },
  {
    Icon: MessageCircle,
    title: 'WhatsApp Automático',
    desc: '"Seu plano vence em 3 dias", "Pagamento confirmado", "Sentimos sua falta". Sem digitar nada.',
  },
  {
    Icon: Cloud,
    title: '100% na Nuvem',
    desc: 'Acesse de qualquer dispositivo. Backup automático e 99,9% de uptime garantido em contrato.',
  },
]

const metrics = [
  { Icon: Zap, value: '< 0,3s', label: 'Verificação biométrica' },
  { Icon: Clock, value: '24h', label: 'Para sua academia rodar' },
  { Icon: TrendingUp, value: '+38%', label: 'Redução de inadimplência' },
  { Icon: Activity, value: '99,9%', label: 'Uptime garantido' },
]

const beforeAfter = {
  before: [
    'Planilha do Excel virando bagunça',
    'Cobrança manual no WhatsApp todo dia 5',
    'Aluno entrando sem pagar (e ninguém vê)',
    'Você descobre quem sumiu... 30 dias depois',
    'Sem ideia de quem dá lucro vs. quem dá prejuízo',
    'Fim do mês: 6h fechando o caixa na mão',
  ],
  after: [
    'Tudo num painel só, atualizado em tempo real',
    'PIX e cartão cobrados sozinhos no dia exato',
    'Catraca bloqueia automaticamente quem não pagou',
    'Aluno some? Mensagem automática em 7 dias',
    'Relatório de receita por plano, idade, retenção',
    'Caixa fechado sozinho. Você só assina',
  ],
}

const steps = [
  {
    n: '01',
    title: 'Importa seus alunos',
    desc: 'Sobe sua planilha do Excel ou cadastra na hora. Em 30 minutos, todo seu cadastro está no sistema.',
  },
  {
    n: '02',
    title: 'Conecta a catraca',
    desc: 'Plug-and-play com Intelbras e Control iD. Não tem catraca? A gente recomenda e instala em 7 dias.',
  },
  {
    n: '03',
    title: 'Ativa as cobranças',
    desc: 'Conecta sua conta bancária ao PIX automático. Pronto — o sistema cobra, libera, bloqueia e relata sozinho.',
  },
]

const testimonials = [
  {
    initials: 'RM',
    name: 'Rafael M.',
    role: 'Dono · Academia Forge Fit',
    city: 'Curitiba/PR',
    quote:
      'Em 60 dias caí de R$ 8.400 de inadimplência pra R$ 2.100. A catraca bloqueando sozinha resolveu um problema que eu tava há 3 anos batendo cabeça.',
  },
  {
    initials: 'JC',
    name: 'Juliana C.',
    role: 'Sócia · Studio Iron Lab',
    city: 'Florianópolis/SC',
    quote:
      'O WhatsApp automático sozinho já vale o plano. Eu fechei 18 renovações no mês passado sem precisar mandar uma mensagem. Pensa em 18 horas que sobraram.',
  },
  {
    initials: 'AF',
    name: 'André F.',
    role: 'Dono · Cross Box Vila',
    city: 'São Paulo/SP',
    quote:
      'Saí de planilha pro GymFlow num sábado. Domingo já tava cobrando PIX. Não precisei de curso, de suporte caro, nada. Funciona.',
  },
]

const integrations = ['PIX', 'Stripe', 'WhatsApp Business', 'Intelbras', 'Control iD', 'Google Calendar']

const faq = [
  {
    q: 'Quanto tempo leva pra minha academia rodar 100%?',
    a: 'A maioria dos clientes fica operacional em 24h: importação de alunos, conexão da catraca e ativação do PIX automático. Se você não tiver catraca ainda, ajudamos na recomendação e instalação em até 7 dias.',
  },
  {
    q: 'Preciso trocar minha catraca?',
    a: 'Não. Trabalhamos plug-and-play com Intelbras e Control iD (as mais comuns do mercado). Se a sua é de outro fabricante, nosso time avalia compatibilidade em 1 dia útil.',
  },
  {
    q: 'A biometria facial é segura e está dentro da LGPD?',
    a: 'Sim. Todo dado biométrico é criptografado, armazenado em servidor brasileiro e o aluno autoriza explicitamente no cadastro. Temos contrato de DPO e relatório de conformidade LGPD disponível.',
  },
  {
    q: 'Tem fidelidade ou multa de cancelamento?',
    a: 'Não. Você cancela quando quiser, sem multa, sem pegadinha. Pagamento mensal — se não servir, cancela e pronto.',
  },
  {
    q: 'Funciona em academia com mais de uma unidade?',
    a: 'Sim. O plano Enterprise dá multi-unidades com painel consolidado, transferência de aluno entre unidades e relatório por filial.',
  },
  {
    q: 'E se eu já uso outro sistema? Vocês migram meus dados?',
    a: 'Sim, sem custo extra. Aceitamos exportação de Pacto, Tecnofit, Evo, planilhas Excel e CSV. Migração média: 1 dia útil.',
  },
  {
    q: 'Vocês oferecem treinamento pra minha equipe?',
    a: 'Sim. Treinamento ao vivo no plano Pro e Enterprise. No Starter, você tem nossa central de vídeos curtos (cada um com menos de 3 min).',
  },
  {
    q: 'Qual a garantia se eu não gostar?',
    a: '30 dias de garantia incondicional. Se em 30 dias após a contratação você não tiver visto valor, devolvemos 100% do que você pagou.',
  },
]

const plans = [
  {
    nome: 'Starter',
    preco: '197',
    desc: 'Até 100 alunos',
    items: ['QR Code de acesso', 'App do aluno', 'PIX automático', 'WhatsApp régua de cobrança', 'Suporte por e-mail'],
    featured: false,
  },
  {
    nome: 'Pro',
    preco: '397',
    desc: 'Até 500 alunos',
    items: ['Tudo do Starter', 'Biometria facial ilimitada', 'Cartão recorrente', 'Relatórios avançados', 'Suporte por WhatsApp'],
    featured: true,
  },
  {
    nome: 'Enterprise',
    preco: '797',
    desc: 'Alunos ilimitados',
    items: ['Tudo do Pro', 'Multi-unidades', 'API pública', 'White-label', 'Gerente de conta dedicado'],
    featured: false,
  },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-dark text-white">
      {/* ───── NAV ───── */}
      <nav className="border-b border-dark-border px-6 py-4 flex items-center justify-between sticky top-0 bg-dark/95 backdrop-blur z-50">
        <Link href="/" className="font-display font-extrabold text-xl">
          <span className="text-cyan">Gym</span>Flow <span className="text-muted font-medium">Gestor</span>
        </Link>
        <div className="hidden md:flex items-center gap-7 text-sm text-muted">
          <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
          <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
          <a href="#planos" className="hover:text-white transition-colors">Planos</a>
          <a href="#faq" className="hover:text-white transition-colors">Dúvidas</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-muted hover:text-white transition-colors">Entrar</Link>
          <Link href="/agendar" className="gradient-btn text-dark font-bold text-sm px-4 py-2 rounded-lg">
            Agendar demo
          </Link>
        </div>
      </nav>

      {/* ───── HERO ───── */}
      <section className="relative max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="absolute inset-x-0 top-10 -z-10 mx-auto h-72 w-[32rem] max-w-full blur-3xl opacity-20 bg-gradient-to-r from-cyan via-blue to-cyan rounded-full" />
        <div className="inline-flex items-center gap-2 bg-cyan/10 border border-cyan/30 rounded-full px-4 py-1.5 text-xs font-bold text-cyan tracking-widest uppercase mb-8">
          <Sparkles size={14} /> Novo · GymFlow Gestor v1.0
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
          Sua academia<br />
          <span className="gradient-text">perdendo dinheiro</span><br />
          no WhatsApp.
        </h1>
        <p className="text-muted text-lg max-w-xl mx-auto mb-10">
          O GymFlow Gestor automatiza o controle de acesso, as cobranças e os alunos — para você parar de apagar incêndio e começar a crescer.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/agendar" className="gradient-btn text-dark font-bold text-base px-8 py-4 rounded-xl inline-flex items-center gap-2">
            Agendar demonstração <ArrowRight size={18} />
          </Link>
          <a href="#demo" className="border border-dark-border text-white text-base px-8 py-4 rounded-xl hover:border-muted transition-colors">
            Ver na prática
          </a>
        </div>
        <p className="text-xs text-muted mt-4">Demo de 30 min · Personalizada pra sua academia · Resposta em até 1h útil</p>
      </section>

      {/* ───── MÉTRICAS / PROVA SOCIAL ───── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="card p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {metrics.map((m) => (
            <div key={m.label} className="text-center">
              <m.Icon size={22} className="text-cyan mx-auto mb-3" />
              <div className="font-display text-3xl md:text-4xl font-black gradient-text leading-none mb-1">{m.value}</div>
              <div className="text-xs text-muted uppercase tracking-wider">{m.label}</div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted mt-4">
          <Users size={12} className="inline mr-1 -mt-0.5" />
          Aceitamos apenas <span className="text-white font-semibold">100 primeiras academias</span> com onboarding 1:1 incluso.
        </p>
      </section>

      {/* ───── FEATURES ───── */}
      <section id="funcionalidades" className="max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <div className="text-xs font-bold uppercase tracking-widest text-cyan mb-3">Tudo num lugar só</div>
          <h2 className="font-display text-3xl md:text-4xl font-bold">A operação inteira da sua academia.</h2>
          <p className="text-muted mt-3 max-w-xl mx-auto">Sem 4 sistemas diferentes. Sem planilha. Sem 2 horas todo dia organizando bagunça.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card p-6 hover:border-cyan/40 transition-colors">
              <div className="w-11 h-11 rounded-xl bg-cyan/10 border border-cyan/30 flex items-center justify-center mb-4">
                <f.Icon size={20} className="text-cyan" />
              </div>
              <h3 className="font-bold text-base mb-2">{f.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── COMPARATIVO ANTES/DEPOIS ───── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <div className="text-xs font-bold uppercase tracking-widest text-orange mb-3">A diferença é brutal</div>
          <h2 className="font-display text-3xl md:text-4xl font-bold">Antes do GymFlow. Depois do GymFlow.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-red/30 bg-red/5 p-7">
            <div className="text-xs font-bold uppercase tracking-widest text-red mb-2">Sua academia hoje</div>
            <h3 className="font-bold text-lg mb-5">Apagando incêndio no WhatsApp</h3>
            <ul className="space-y-3">
              {beforeAfter.before.map((b) => (
                <li key={b} className="flex gap-3 text-sm text-muted">
                  <X size={18} className="text-red flex-shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-green/40 bg-green/5 p-7">
            <div className="text-xs font-bold uppercase tracking-widest text-green mb-2">Com GymFlow Gestor</div>
            <h3 className="font-bold text-lg mb-5">Sua academia trabalhando sozinha</h3>
            <ul className="space-y-3">
              {beforeAfter.after.map((a) => (
                <li key={a} className="flex gap-3 text-sm">
                  <Check size={18} className="text-green flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───── COMO FUNCIONA EM 3 PASSOS ───── */}
      <section id="como-funciona" className="max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <div className="text-xs font-bold uppercase tracking-widest text-cyan mb-3">Setup em 24 horas</div>
          <h2 className="font-display text-3xl md:text-4xl font-bold">Sua academia rodando em 3 passos.</h2>
          <p className="text-muted mt-3 max-w-xl mx-auto">Não tem complexidade. Não tem curso de 30 horas. Você liga, configura, opera.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={s.n} className="relative card p-7">
              <div className="font-display text-5xl font-black text-cyan/20 leading-none mb-4">{s.n}</div>
              <h3 className="font-bold text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
              {i < steps.length - 1 && (
                <ArrowRight size={20} className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 text-cyan/40" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ───── DEMO VISUAL ───── */}
      <section id="demo" className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <div className="text-xs font-bold uppercase tracking-widest text-cyan mb-3">Veja na prática</div>
          <h2 className="font-display text-3xl md:text-4xl font-bold">Bonito de operar. Fácil de entender.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mockup 1 — Dashboard */}
          <div className="card p-5">
            <div className="rounded-xl bg-dark-card2 border border-dark-border p-4 mb-4 aspect-[4/3] flex flex-col justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red/60" />
                <div className="w-2 h-2 rounded-full bg-orange/60" />
                <div className="w-2 h-2 rounded-full bg-green/60" />
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-md bg-cyan/10 border border-cyan/30 px-2 py-1.5">
                    <div className="text-[9px] text-muted">Receita</div>
                    <div className="text-sm font-bold text-cyan">R$ 24k</div>
                  </div>
                  <div className="rounded-md bg-green/10 border border-green/30 px-2 py-1.5">
                    <div className="text-[9px] text-muted">Ativos</div>
                    <div className="text-sm font-bold text-green">387</div>
                  </div>
                  <div className="rounded-md bg-orange/10 border border-orange/30 px-2 py-1.5">
                    <div className="text-[9px] text-muted">Hoje</div>
                    <div className="text-sm font-bold text-orange">142</div>
                  </div>
                </div>
                <div className="h-10 rounded-md bg-gradient-to-r from-cyan/20 to-blue/10 border border-dark-border" />
                <div className="h-3 rounded-sm bg-dark-border/60 w-3/4" />
                <div className="h-3 rounded-sm bg-dark-border/60 w-1/2" />
              </div>
            </div>
            <h3 className="font-bold text-sm flex items-center gap-2">
              <BarChart3 size={14} className="text-cyan" /> Dashboard do gestor
            </h3>
            <p className="text-xs text-muted mt-1">KPIs em tempo real, receita, retenção e movimento por hora.</p>
          </div>

          {/* Mockup 2 — App do aluno */}
          <div className="card p-5">
            <div className="rounded-xl bg-dark-card2 border border-dark-border p-4 mb-4 aspect-[4/3] flex flex-col items-center justify-center">
              <div className="w-24 h-24 rounded-2xl bg-white p-3 mb-3 flex items-center justify-center">
                <QrCode size={56} className="text-dark" strokeWidth={1.5} />
              </div>
              <div className="text-[10px] text-muted uppercase tracking-wider">Acesso liberado</div>
              <div className="text-sm font-bold text-green">João Silva · Plano Pro</div>
            </div>
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Smartphone size={14} className="text-cyan" /> App do aluno
            </h3>
            <p className="text-xs text-muted mt-1">QR Code de acesso, treinos, renovação online e check-in histórico.</p>
          </div>

          {/* Mockup 3 — Catraca biométrica */}
          <div className="card p-5">
            <div className="rounded-xl bg-dark-card2 border border-dark-border p-4 mb-4 aspect-[4/3] flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-4 rounded-lg border border-cyan/40 [mask-image:linear-gradient(180deg,#000,transparent)]" />
              <div className="w-20 h-20 rounded-full border-2 border-cyan flex items-center justify-center mb-3 shadow-glow">
                <Fingerprint size={32} className="text-cyan" />
              </div>
              <div className="text-[10px] text-green uppercase tracking-wider">Verificado em 0,28s</div>
              <div className="text-sm font-bold text-white">Bem-vinda, Maria</div>
            </div>
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Fingerprint size={14} className="text-cyan" /> Terminal biométrico
            </h3>
            <p className="text-xs text-muted mt-1">Reconhecimento facial em menos de 0,3s direto da catraca.</p>
          </div>
        </div>
      </section>

      {/* ───── DEPOIMENTOS ───── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <div className="text-xs font-bold uppercase tracking-widest text-cyan mb-3">Quem já tá usando</div>
          <h2 className="font-display text-3xl md:text-4xl font-bold">Donos de academia dormindo melhor.</h2>
        </div>
        {/* TODO: substituir por depoimentos reais conforme primeiros clientes assinarem */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="card p-6 flex flex-col">
              <p className="text-sm text-white/90 leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-auto flex items-center gap-3 pt-4 border-t border-dark-border">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan to-blue flex items-center justify-center font-bold text-dark text-sm">
                  {t.initials}
                </div>
                <div>
                  <div className="font-bold text-sm">{t.name}</div>
                  <div className="text-xs text-muted">{t.role}</div>
                  <div className="text-xs text-muted">{t.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── INTEGRAÇÕES ───── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-8">
          <div className="text-xs font-bold uppercase tracking-widest text-muted mb-2">Integrações nativas</div>
          <h3 className="font-display text-xl font-bold">Conecta com o que você já usa</h3>
        </div>
        <div className="card p-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {integrations.map((i) => (
              <span key={i} className="font-display font-bold text-sm md:text-base text-muted/70 hover:text-white transition-colors">
                {i}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ───── PLANOS ───── */}
      <section id="planos" className="max-w-5xl mx-auto px-6 pb-24 text-center">
        <div className="mb-12">
          <div className="text-xs font-bold uppercase tracking-widest text-cyan mb-3">Preço justo</div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">Escolha seu plano.</h2>
          <p className="text-muted">Conheça na demo e escolha o plano que cabe na sua academia.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.nome}
              className={`rounded-2xl p-8 relative ${p.featured ? 'border-2 border-cyan bg-cyan/5 shadow-glow' : 'card'}`}
            >
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan text-dark text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                  Mais popular
                </div>
              )}
              <div className="text-xs font-bold uppercase tracking-widest text-muted mb-2">{p.nome}</div>
              <div className="font-display text-4xl font-black mb-1">
                <sup className="text-xl">R$</sup>
                {p.preco}
                <small className="text-base font-normal text-muted">/mês</small>
              </div>
              <div className="text-xs text-muted mb-6">{p.desc}</div>
              <ul className="space-y-2 mb-6 text-left">
                {p.items.map((i) => (
                  <li key={i} className="text-sm text-muted flex gap-2">
                    <Check size={16} className="text-cyan flex-shrink-0 mt-0.5" />
                    {i}
                  </li>
                ))}
              </ul>
              <Link
                href="/agendar"
                className={`w-full block text-center py-3 rounded-xl font-bold text-sm ${
                  p.featured
                    ? 'gradient-btn text-dark'
                    : 'border border-dark-border hover:border-muted text-white transition-colors'
                }`}
              >
                Agendar demonstração
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ───── FAQ ───── */}
      <section id="faq" className="max-w-3xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <div className="text-xs font-bold uppercase tracking-widest text-cyan mb-3">Dúvidas frequentes</div>
          <h2 className="font-display text-3xl md:text-4xl font-bold">Respondemos antes de você perguntar.</h2>
        </div>
        <div className="space-y-3">
          {faq.map((item) => (
            <details key={item.q} className="card p-5 group">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="font-semibold text-sm md:text-base">{item.q}</span>
                <ChevronDown size={18} className="text-muted group-open:rotate-180 transition-transform flex-shrink-0 ml-4" />
              </summary>
              <p className="text-sm text-muted leading-relaxed mt-3">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ───── CTA FINAL + GARANTIA ───── */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="rounded-3xl border-2 border-cyan/40 bg-gradient-to-br from-cyan/10 via-blue/5 to-transparent p-10 md:p-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,_rgba(0,229,255,0.15),_transparent_60%)]" />
          <div className="inline-flex items-center gap-2 bg-green/10 border border-green/30 rounded-full px-4 py-1.5 text-xs font-bold text-green tracking-widest uppercase mb-6">
            <Shield size={14} /> Garantia de 30 dias
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4">
            Tira sua academia<br />
            <span className="gradient-text">do modo sobrevivência</span>.
          </h2>
          <p className="text-muted text-base md:text-lg max-w-xl mx-auto mb-8">
            Demo de 30 min, personalizada pra sua academia. Se contratar e em 30 dias não tiver visto valor real,
            <span className="text-white"> devolvemos 100% do que você pagou.</span>
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap mb-6">
            <Link href="/agendar" className="gradient-btn text-dark font-bold text-base px-8 py-4 rounded-xl inline-flex items-center gap-2">
              Agendar minha demonstração <ArrowRight size={18} />
            </Link>
            <a
              href="https://wa.me/5565996952828"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-dark-border text-white text-base px-8 py-4 rounded-xl hover:border-muted transition-colors inline-flex items-center gap-2"
            >
              <MessageCircle size={18} /> Falar com vendas
            </a>
          </div>
          <div className="flex items-center justify-center gap-6 text-xs text-muted flex-wrap">
            <span className="inline-flex items-center gap-1.5"><Check size={12} className="text-green" /> Demo de 30 min</span>
            <span className="inline-flex items-center gap-1.5"><Check size={12} className="text-green" /> Sem fidelidade</span>
            <span className="inline-flex items-center gap-1.5"><Check size={12} className="text-green" /> Cancela quando quiser</span>
          </div>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer className="border-t border-dark-border bg-dark/50">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="font-display font-extrabold text-xl mb-3">
                <span className="text-cyan">Gym</span>Flow <span className="text-muted font-medium">Gestor</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                A operação inteira da sua academia em uma única plataforma.
              </p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-white mb-3">Produto</div>
              <ul className="space-y-2 text-sm text-muted">
                <li><a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a></li>
                <li><a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a></li>
                <li><a href="#planos" className="hover:text-white transition-colors">Planos</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">Dúvidas</a></li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-white mb-3">Empresa</div>
              <ul className="space-y-2 text-sm text-muted">
                <li><Link href="/login" className="hover:text-white transition-colors">Entrar</Link></li>
                <li><Link href="/agendar" className="hover:text-white transition-colors">Criar conta</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Termos de uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-white mb-3">Contato</div>
              <ul className="space-y-2 text-sm text-muted">
                <li className="flex items-center gap-2">
                  <Mail size={14} className="text-cyan" />
                  <a href="mailto:contato@gymflowgestor.com.br" className="hover:text-white transition-colors">
                    contato@gymflowgestor.com.br
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MessageCircle size={14} className="text-cyan" />
                  <a href="https://wa.me/5565996952828" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    WhatsApp
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={14} className="text-cyan" />
                  <a href="tel:+5565996952828" className="hover:text-white transition-colors">
                    (65) 99695-2828
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-dark-border pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted">
            <span>© 2026 GymFlow Gestor · gymflowgestor.com.br · Sua academia. Sob controle.</span>
            <span className="flex items-center gap-2">
              Feito por <span className="text-white font-semibold">FJN Tecnologia</span>
              <span className="text-muted/30">·</span>
              <Link
                href="/admin"
                className="text-[10px] text-muted/50 hover:text-muted transition-colors uppercase tracking-wider"
                title="Painel administrativo SaaS"
              >
                Acesso adm SaaS
              </Link>
            </span>
          </div>
        </div>
      </footer>
    </main>
  )
}

