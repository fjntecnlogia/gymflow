'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Rocket, Package, Users, Cpu, ShieldCheck, BarChart3,
  ArrowRight, X, Check, CheckCircle2, Sparkles,
} from 'lucide-react'
import { api } from '@/lib/api'

interface Passo {
  Icon: typeof Rocket
  titulo: string
  descricao: string
  cta?: { label: string; href: string }
  cor: string
}

const PASSOS: Passo[] = [
  {
    Icon: Rocket,
    titulo: 'Bem-vindo(a) ao GymFlow Gestor! 🎉',
    descricao:
      'Sua academia agora tem o melhor sistema de gestão do Brasil. Em 5 minutos você sai daqui com tudo configurado pra atender seus alunos com excelência.',
    cor: 'cyan',
  },
  {
    Icon: Package,
    titulo: 'Passo 1 — Cadastra seus planos',
    descricao:
      'Defina os planos que sua academia oferece (mensal, trimestral, anual, etc.). Eles vão ser usados quando você matricular os alunos. Pode editar tudo depois.',
    cta: { label: 'Cadastrar planos', href: '/planos' },
    cor: 'green',
  },
  {
    Icon: Users,
    titulo: 'Passo 2 — Cadastra teus alunos',
    descricao:
      'Importa de planilha Excel/CSV ou cadastra um a um. Cada aluno recebe QR Code próprio + (opcional) face cadastrada pra catraca biométrica.',
    cta: { label: 'Ir para alunos', href: '/alunos' },
    cor: 'orange',
  },
  {
    Icon: Cpu,
    titulo: 'Passo 3 — Conecta tua catraca',
    descricao:
      'Plug-and-play com Intelbras e Control iD. Não tem catraca? A gente recomenda e instala em 7 dias. Trabalha 100% via QR Code ou biometria facial.',
    cta: { label: 'Configurar catraca', href: '/catracas' },
    cor: 'cyan',
  },
  {
    Icon: ShieldCheck,
    titulo: 'Passo 4 — Controle de Acesso',
    descricao:
      'Aqui você vê em tempo real quem está na academia, quem entrou hoje, e quem foi bloqueado por inadimplência. Acompanha tudo num painel só.',
    cta: { label: 'Ver acessos', href: '/acesso' },
    cor: 'green',
  },
  {
    Icon: BarChart3,
    titulo: 'Tudo pronto! 🚀',
    descricao:
      'Sua academia tá no ar. Use o menu lateral pra acessar Financeiro, Relatórios, Notificações WhatsApp e mais. Qualquer dúvida, fala com a gente no WhatsApp.',
    cor: 'cyan',
  },
]

interface Props {
  onClose: () => void
  /** Se true, não chama API ao concluir (modo preview/admin) */
  preview?: boolean
}

export function TutorialOnboarding({ onClose, preview = false }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [salvando, setSalvando] = useState(false)

  // Esc fecha
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const passo = PASSOS[step]
  const ehUltimo = step === PASSOS.length - 1
  const ehPrimeiro = step === 0
  const progresso = ((step + 1) / PASSOS.length) * 100

  function next() {
    if (ehUltimo) return concluir()
    setStep((s) => Math.min(s + 1, PASSOS.length - 1))
  }
  function prev() {
    if (ehPrimeiro) return
    setStep((s) => Math.max(s - 1, 0))
  }

  async function concluir() {
    if (preview) {
      onClose()
      return
    }
    setSalvando(true)
    try {
      await api.post('/auth/me/onboarding-concluido')
      // Atualiza cache local de usuario se existir
      try {
        const stored = JSON.parse(localStorage.getItem('gymflow_usuario') || '{}')
        stored.onboardingConcluido = true
        localStorage.setItem('gymflow_usuario', JSON.stringify(stored))
      } catch { /* noop */ }
    } catch {
      // Falhou? Continua mesmo assim — não bloqueia o usuário
    } finally {
      setSalvando(false)
      onClose()
    }
  }

  async function handleClose() {
    // Considera "pular" como concluído pra não voltar a aparecer
    await concluir()
  }

  function irPara(href: string) {
    // Marca como concluído ao começar a jornada
    concluir()
    router.push(href)
  }

  const corText = `text-${passo.cor}`
  const corBg = `bg-${passo.cor}/10`
  const corBorder = `border-${passo.cor}/30`

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="card max-w-lg w-full p-0 overflow-hidden relative">
        {/* Barra de progresso */}
        <div className="h-1 bg-dark-card2 relative">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan to-blue transition-all duration-300"
            style={{ width: `${progresso}%` }}
          />
        </div>

        {/* Botão fechar */}
        <button
          onClick={handleClose}
          disabled={salvando}
          className="absolute top-4 right-4 text-muted hover:text-white transition-colors disabled:opacity-50"
          aria-label="Fechar tutorial"
        >
          <X size={20} />
        </button>

        {/* Conteúdo */}
        <div className="p-8 pt-10">
          {/* Ícone */}
          <div className={`w-16 h-16 rounded-2xl ${corBg} border ${corBorder} flex items-center justify-center mb-6`}>
            <passo.Icon size={28} className={corText} />
          </div>

          {/* Step counter */}
          <div className="text-xs font-bold uppercase tracking-widest text-muted mb-2 flex items-center gap-2">
            <Sparkles size={10} />
            Passo {step + 1} de {PASSOS.length}
          </div>

          {/* Título */}
          <h2 className="font-display text-2xl font-bold mb-3 leading-tight">
            {passo.titulo}
          </h2>

          {/* Descrição */}
          <p className="text-sm text-muted leading-relaxed mb-6">
            {passo.descricao}
          </p>

          {/* Indicador de passos (dots) */}
          <div className="flex items-center gap-1.5 mb-6">
            {PASSOS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? 'bg-cyan w-8'
                    : i < step
                    ? 'bg-cyan/40 w-1.5'
                    : 'bg-dark-border w-1.5 hover:bg-muted'
                }`}
                aria-label={`Ir pro passo ${i + 1}`}
              />
            ))}
          </div>

          {/* Ações */}
          <div className="flex items-center gap-3">
            {!ehPrimeiro && (
              <button
                onClick={prev}
                disabled={salvando}
                className="px-4 py-2.5 text-sm font-semibold text-muted hover:text-white transition-colors"
              >
                Voltar
              </button>
            )}

            <div className="flex-1" />

            {passo.cta && !ehUltimo && (
              <button
                onClick={() => irPara(passo.cta!.href)}
                disabled={salvando}
                className="gradient-btn text-dark font-bold text-sm px-5 py-2.5 rounded-xl inline-flex items-center gap-2 disabled:opacity-50"
              >
                {passo.cta.label} <ArrowRight size={14} />
              </button>
            )}

            {!passo.cta && !ehUltimo && (
              <button
                onClick={next}
                disabled={salvando}
                className="gradient-btn text-dark font-bold text-sm px-5 py-2.5 rounded-xl inline-flex items-center gap-2 disabled:opacity-50"
              >
                Próximo <ArrowRight size={14} />
              </button>
            )}

            {ehUltimo && (
              <button
                onClick={concluir}
                disabled={salvando}
                className="gradient-btn text-dark font-bold text-sm px-6 py-2.5 rounded-xl inline-flex items-center gap-2 disabled:opacity-50"
              >
                {salvando ? 'Salvando...' : <>Começar a usar <CheckCircle2 size={14} /></>}
              </button>
            )}
          </div>

          {/* Skip pequeno */}
          {!ehUltimo && (
            <button
              onClick={handleClose}
              disabled={salvando}
              className="text-[11px] text-muted hover:text-white transition-colors mt-4 underline-offset-2 hover:underline"
            >
              Pular tutorial
            </button>
          )}
        </div>

        {/* Footer com dica */}
        <div className="bg-dark-card2/50 border-t border-dark-border px-8 py-3 text-[11px] text-muted flex items-center gap-2">
          <Check size={11} />
          Use as setas ←→ pra navegar. Tudo aqui pode ser revisitado em
          <span className="text-cyan font-semibold ml-1">Configurações → Ver tutorial</span>
        </div>
      </div>
    </div>
  )
}
