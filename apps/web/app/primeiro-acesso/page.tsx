import { RedirectAlunoApp } from '@/components/RedirectAlunoApp'

export const metadata = {
  title: 'Primeiro acesso — GymFlow Gestor para Alunos',
  description: 'Abrir o app GymFlow Gestor para Alunos pra criar sua senha.',
}

export default function PrimeiroAcessoPage() {
  return (
    <RedirectAlunoApp
      action="criar-senha"
      titulo="Bem-vindo(a) ao GymFlow!"
      descricao="Toca no botão abaixo pra abrir o app e criar sua senha de acesso."
    />
  )
}
