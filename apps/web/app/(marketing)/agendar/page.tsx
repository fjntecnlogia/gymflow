'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  Shield,
  Sparkles,
  CheckCircle2,
  Loader2,
  User,
  Phone,
  Building2,
  MapPin,
  Users,
  Calendar as CalendarIcon,
  MessageSquare,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

// ───────────────────────────────────────────────────────────
// /agendar — Página pública de solicitação de demonstração
//
// FRONTEND: pronto. Aplica design system do app (cores cyan/green,
//   tema dark, font-display, classes .card / .input / .gradient-btn).
//
// BACKEND (TODO — fora do escopo desta tarefa):
//   ◾ Criar endpoint POST /agendamentos na API (apps/api).
//   ◾ Schema sugerido em apps/api/src/routes/agendamentos.ts:
//       interface Agendamento {
//         id: uuid; createdAt: timestamptz;
//         nome: string; telefone: string; email?: string;
//         academiaNome: string; cidade: string;
//         numAlunos: '0-50' | '50-200' | '200-500' | '500+';
//         horarioPreferido: string; observacao?: string;
//         status: 'pendente' | 'contatado' | 'convertido' | 'perdido';
//         contatadoEm?: timestamptz; convertidoEm?: timestamptz;
//       }
//   ◾ Adicionar rota no banco (Supabase): tabela `agendamentos`.
//   ◾ Implementar rate-limiting (1 req / IP / 5min) pra evitar spam.
//   ◾ Disparar webhook/notificação WhatsApp ao admin no created.
// ───────────────────────────────────────────────────────────

const HORARIOS = [
  'Manhã (8h–12h)',
  'Tarde (12h–18h)',
  'Noite (18h–22h)',
  'Qualquer horário',
]

const FAIXAS_ALUNOS = [
  { value: '0-50', label: 'Até 50 alunos' },
  { value: '50-200', label: '50 a 200 alunos' },
  { value: '200-500', label: '200 a 500 alunos' },
  { value: '500+', label: 'Mais de 500 alunos' },
]

function formatTelefone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  return d
}

export default function AgendarPage() {
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    email: '',
    academiaNome: '',
    cidade: '',
    numAlunos: '50-200',
    horarioPreferido: 'Qualquer horário',
    observacao: '',
  })
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  function setField<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.nome.trim().length < 2) return toast.error('Informe seu nome.')
    if (form.telefone.replace(/\D/g, '').length < 10) return toast.error('Telefone inválido.')
    if (form.academiaNome.trim().length < 2) return toast.error('Informe o nome da academia.')
    if (form.cidade.trim().length < 2) return toast.error('Informe sua cidade.')

    setLoading(true)
    try {
      // TODO BACKEND: endpoint POST /agendamentos ainda não existe.
      // Por enquanto, o submit pode retornar erro 404 — capturamos abaixo
      // e mostramos a tela de sucesso mesmo assim (lead chega via fallback WhatsApp).
      await api.post('/agendamentos', form)
      setEnviado(true)
    } catch (err) {
      // Fallback: enquanto o backend não tem o endpoint, abrir WhatsApp
      // com mensagem pré-preenchida para não perder o lead.
      const msg = encodeURIComponent(
        `Olá! Quero agendar uma demonstração do GymFlow Gestor.%0A%0A` +
        `Nome: ${form.nome}%0A` +
        `Academia: ${form.academiaNome}%0A` +
        `Cidade: ${form.cidade}%0A` +
        `Alunos: ${FAIXAS_ALUNOS.find(f => f.value === form.numAlunos)?.label}%0A` +
        `Melhor horário: ${form.horarioPreferido}%0A` +
        (form.observacao ? `Obs: ${form.observacao}%0A` : '') +
        `Telefone: ${form.telefone}`
      )
      window.open(`https://wa.me/5565996952828?text=${msg}`, '_blank')
      setEnviado(true)
    } finally {
      setLoading(false)
    }
  }

  // ─── Tela de sucesso ───────────────────────────────────
  if (enviado) {
    return (
      <main className="min-h-screen bg-dark text-white flex items-center justify-center p-6">
        <div className="card max-w-md w-full p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-green/15 border border-green/40 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-green" />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-3">
            Recebemos sua solicitação!
          </h1>
          <p className="text-muted text-sm mb-6 leading-relaxed">
            Nosso time entra em contato em até <span className="text-white font-semibold">1 hora útil</span> pelo
            telefone <span className="text-cyan font-semibold">{form.telefone}</span> pra agendar sua demonstração de 30 min.
          </p>
          <div className="border-t border-dark-border pt-6 space-y-3 text-sm text-left">
            <p className="flex items-start gap-2 text-muted">
              <Check size={16} className="text-cyan flex-shrink-0 mt-0.5" />
              Você verá o sistema funcionando com dados reais
            </p>
            <p className="flex items-start gap-2 text-muted">
              <Check size={16} className="text-cyan flex-shrink-0 mt-0.5" />
              Tira todas as suas dúvidas, ao vivo
            </p>
            <p className="flex items-start gap-2 text-muted">
              <Check size={16} className="text-cyan flex-shrink-0 mt-0.5" />
              Recebe proposta personalizada pra sua academia
            </p>
          </div>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 text-sm text-muted hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Voltar para a home
          </Link>
        </div>
      </main>
    )
  }

  // ─── Form principal ────────────────────────────────────
  return (
    <main className="min-h-screen bg-dark text-white">
      <nav className="border-b border-dark-border px-6 py-4 flex items-center justify-between sticky top-0 bg-dark/95 backdrop-blur z-50">
        <Link href="/" className="font-display font-extrabold text-xl">
          <span className="text-cyan">Gym</span>Flow <span className="text-muted font-medium">Gestor</span>
        </Link>
        <Link href="/login" className="text-sm text-muted hover:text-white transition-colors">
          Já sou cliente
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-start">
          {/* ─── Coluna esquerda: contexto/valor ─── */}
          <div className="md:sticky md:top-24">
            <div className="inline-flex items-center gap-2 bg-cyan/10 border border-cyan/30 rounded-full px-4 py-1.5 text-xs font-bold text-cyan tracking-widest uppercase mb-6">
              <Sparkles size={14} /> Demonstração 1:1
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-black leading-tight mb-5">
              Veja a sua academia<br />
              <span className="gradient-text">trabalhando sozinha.</span>
            </h1>
            <p className="text-muted text-base md:text-lg mb-8 leading-relaxed">
              30 minutos com nosso time, ao vivo, com sistema real rodando.
              Você sai sabendo exatamente quanto vai economizar e o que muda no seu mês.
            </p>

            <div className="space-y-4 mb-8">
              {[
                { Icon: Clock, t: 'Resposta em até 1h útil', d: 'Te ligamos pra confirmar o melhor horário.' },
                { Icon: User, t: 'Demo personalizada', d: 'Focada nos problemas da sua academia, não num script genérico.' },
                { Icon: Shield, t: 'Sem compromisso', d: 'Conhece o sistema, recebe a proposta, decide depois.' },
              ].map((b) => (
                <div key={b.t} className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan/10 border border-cyan/30 flex items-center justify-center flex-shrink-0">
                    <b.Icon size={18} className="text-cyan" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{b.t}</div>
                    <div className="text-xs text-muted">{b.d}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card p-5 bg-cyan/5 border-cyan/30">
              <p className="text-sm italic text-white/90 leading-relaxed">
                &ldquo;Em 60 dias caí de R$ 8.400 de inadimplência pra R$ 2.100. Resolveu um problema que eu tava 3 anos batendo cabeça.&rdquo;
              </p>
              <div className="text-xs text-muted mt-3">— Rafael M. · Forge Fit · Curitiba/PR</div>
            </div>
          </div>

          {/* ─── Coluna direita: form ─── */}
          <form onSubmit={handleSubmit} className="card p-7 md:p-8 space-y-5">
            <div className="mb-2">
              <h2 className="font-display text-xl font-bold mb-1">Preencha seus dados</h2>
              <p className="text-xs text-muted">Leva 1 minuto · Seus dados estão seguros</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted uppercase tracking-widest flex items-center gap-1.5">
                <User size={12} /> Seu nome
              </label>
              <input
                className="input"
                type="text"
                placeholder="Ex: Rafael Almeida"
                value={form.nome}
                onChange={(e) => setField('nome', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-widest flex items-center gap-1.5">
                  <Phone size={12} /> WhatsApp
                </label>
                <input
                  className="input"
                  type="tel"
                  placeholder="(65) 99999-9999"
                  value={form.telefone}
                  onChange={(e) => setField('telefone', formatTelefone(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-widest">
                  E-mail (opcional)
                </label>
                <input
                  className="input"
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-widest flex items-center gap-1.5">
                  <Building2 size={12} /> Nome da academia
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="Ex: Forge Fit"
                  value={form.academiaNome}
                  onChange={(e) => setField('academiaNome', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin size={12} /> Cidade / UF
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="Cuiabá/MT"
                  value={form.cidade}
                  onChange={(e) => setField('cidade', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted uppercase tracking-widest flex items-center gap-1.5">
                <Users size={12} /> Quantos alunos hoje
              </label>
              <select
                className="input"
                value={form.numAlunos}
                onChange={(e) => setField('numAlunos', e.target.value)}
              >
                {FAIXAS_ALUNOS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted uppercase tracking-widest flex items-center gap-1.5">
                <CalendarIcon size={12} /> Melhor horário pra te ligar
              </label>
              <select
                className="input"
                value={form.horarioPreferido}
                onChange={(e) => setField('horarioPreferido', e.target.value)}
              >
                {HORARIOS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted uppercase tracking-widest flex items-center gap-1.5">
                <MessageSquare size={12} /> Conta o que mais te incomoda hoje (opcional)
              </label>
              <textarea
                className="input min-h-[80px] resize-y"
                placeholder="Ex: inadimplência alta, controle de acesso, planilha bagunçada..."
                value={form.observacao}
                onChange={(e) => setField('observacao', e.target.value)}
                maxLength={500}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="gradient-btn text-dark font-bold text-base w-full py-4 rounded-xl inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Enviando...</>
              ) : (
                <>Quero agendar minha demonstração <ArrowRight size={18} /></>
              )}
            </button>

            <p className="text-[11px] text-muted text-center leading-relaxed">
              Ao enviar, você concorda em receber contato do nosso time pelo WhatsApp ou telefone informado.
              Não enviamos spam.
            </p>
          </form>
        </div>
      </div>
    </main>
  )
}
