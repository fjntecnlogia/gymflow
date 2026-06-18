import { RedirectAlunoApp } from '@/components/RedirectAlunoApp'

export const metadata = {
  title: 'Redefinir senha — GymFlow Gestor para Alunos',
  description: 'Abrir o app GymFlow Gestor para Alunos pra redefinir sua senha.',
}

export default function RedefinirSenhaAlunoPage() {
  return (
    <RedirectAlunoApp
      action="redefinir-senha"
      titulo="Redefinir sua senha"
      descricao="Toca no botão abaixo pra abrir o app e criar uma nova senha."
    />
  )
}
