'use client'
import { Suspense } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

function Conteudo() {
  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-10 text-center">
        <CheckCircle size={64} className="text-green mx-auto mb-6" />
        <h1 className="font-display text-3xl font-black mb-3">
          <span className="text-cyan">GYM</span>FLOW Ativado!
        </h1>
        <p className="text-muted mb-2">Sua assinatura foi confirmada com sucesso.</p>
        <p className="text-sm text-muted mb-8">
          Acesso liberado — comece a cadastrar seus alunos agora mesmo!
        </p>
        <div className="space-y-3">
          <Link href="/dashboard" className="gradient-btn text-dark font-bold px-8 py-3 rounded-xl block w-full text-center">
            Acessar Dashboard →
          </Link>
          <Link href="/alunos" className="border border-dark-border text-white font-semibold px-8 py-3 rounded-xl block w-full text-center hover:border-muted transition-colors text-sm">
            Cadastrar primeiro aluno
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AssinaturaSucessoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark flex items-center justify-center"><Loader2 className="text-cyan animate-spin" size={40} /></div>}>
      <Conteudo />
    </Suspense>
  )
}
