'use client'

import { Suspense } from 'react'
import { CheckCircle2, Loader2, Mail, ShieldCheck, ArrowRight, MessageCircle } from 'lucide-react'
import Link from 'next/link'

function Conteudo() {
  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="card max-w-lg w-full p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-green/15 border border-green/40 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={32} className="text-green" />
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-black tracking-tight mb-3">
          Pagamento confirmado!<br />
          <span className="gradient-text">Sua academia está ativa.</span>
        </h1>
        <p className="text-muted text-sm mb-6 leading-relaxed">
          Recebemos seu pagamento. Sua conta foi criada e você já é cliente GymFlow Gestor.
        </p>

        {/* Bloco de instrução de próximo passo */}
        <div className="rounded-xl bg-cyan/5 border border-cyan/30 p-5 text-left mb-6">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan/10 border border-cyan/30 flex items-center justify-center flex-shrink-0">
              <Mail size={16} className="text-cyan" />
            </div>
            <div>
              <h3 className="font-bold text-sm mb-1.5">Verifique seu e-mail</h3>
              <p className="text-xs text-muted leading-relaxed">
                Acabamos de enviar um <strong className="text-white">link de acesso</strong> pro
                e-mail informado no pagamento. Clica nele pra criar sua senha e entrar no painel.
              </p>
              <p className="text-[11px] text-muted mt-2 italic">
                Não chegou em 1 min? Confere o spam — remetente
                <code className="bg-dark-card2 px-1 rounded mx-1">noreply@mail.app.supabase.io</code>
              </p>
            </div>
          </div>
        </div>

        {/* Garantia */}
        <div className="inline-flex items-center gap-2 bg-green/10 border border-green/30 rounded-full px-3 py-1.5 text-[11px] font-bold text-green tracking-widest uppercase mb-6">
          <ShieldCheck size={12} /> Garantia de 30 dias
        </div>

        {/* Ações */}
        <div className="space-y-2.5">
          <Link
            href="/login"
            className="gradient-btn text-dark font-bold px-6 py-3 rounded-xl inline-flex items-center justify-center gap-2 w-full"
          >
            Ir pra tela de login <ArrowRight size={16} />
          </Link>
          <a
            href="https://wa.me/5565996952828?text=Acabei%20de%20assinar%20o%20GymFlow%20Gestor%20mas%20preciso%20de%20ajuda%20para%20acessar"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-2.5 rounded-xl text-xs text-muted hover:text-white border border-dark-border hover:border-muted transition-colors"
          >
            <MessageCircle size={12} className="inline mr-1 -mt-0.5" />
            Tive problema com o e-mail — falar com suporte
          </a>
        </div>
      </div>
    </div>
  )
}

export default function AssinaturaSucessoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-dark flex items-center justify-center">
          <Loader2 className="text-cyan animate-spin" size={40} />
        </div>
      }
    >
      <Conteudo />
    </Suspense>
  )
}
