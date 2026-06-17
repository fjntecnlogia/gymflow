import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Termos de Uso — GymFlow Gestor',
  description: 'Termos e condições de uso da plataforma GymFlow Gestor.',
}

const ATUALIZADO_EM = '17 de junho de 2026'

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-dark text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Voltar para o site
        </Link>

        <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight mb-2">
          Termos de Uso
        </h1>
        <p className="text-sm text-muted mb-12">
          Última atualização: {ATUALIZADO_EM}
        </p>

        <div className="prose-content space-y-10 text-sm leading-relaxed text-muted">
          <Secao titulo="1. Aceite dos termos">
            Ao criar uma conta, contratar um plano ou utilizar qualquer parte da plataforma
            <strong className="text-white"> GymFlow Gestor</strong> (“Plataforma”), você
            (“Cliente”) declara que leu, entendeu e concorda com estes Termos de Uso e com a
            nossa <Link href="/privacidade" className="text-cyan hover:underline">Política de
            Privacidade</Link>. Se você não concorda, não utilize a Plataforma.
          </Secao>

          <Secao titulo="2. Sobre a plataforma">
            O GymFlow Gestor é um software como serviço (SaaS) destinado à gestão operacional
            de academias e estúdios, oferecendo cadastro de alunos, controle de acesso,
            cobrança recorrente, agenda, biometria facial, relatórios e demais recursos
            descritos em <Link href="/" className="text-cyan hover:underline">gymflowgestor.com.br</Link>.
            A Plataforma é fornecida pela <strong className="text-white">FJN Tecnologia</strong>.
          </Secao>

          <Secao titulo="3. Cadastro e conta">
            <ul className="list-disc pl-5 space-y-2">
              <li>Você deve fornecer dados verdadeiros, completos e atualizados no cadastro.</li>
              <li>Você é responsável por manter sua senha em sigilo e por todas as atividades realizadas em sua conta.</li>
              <li>Você deve ter capacidade legal para contratar e atuar em nome da academia que representa.</li>
              <li>É vedado compartilhar credenciais ou ceder o acesso a terceiros não autorizados.</li>
            </ul>
          </Secao>

          <Secao titulo="4. Planos, pagamento e renovação">
            <ul className="list-disc pl-5 space-y-2">
              <li>Os planos, preços e funcionalidades são apresentados em <Link href="/planos-saas" className="text-cyan hover:underline">/planos-saas</Link> e podem ser atualizados a qualquer tempo.</li>
              <li>O pagamento é mensal e recorrente, processado por meio de gateway terceiro (Stripe).</li>
              <li>A assinatura é renovada automaticamente até cancelamento expresso pelo Cliente.</li>
              <li>Em caso de inadimplência, a Plataforma pode suspender o acesso após aviso prévio.</li>
            </ul>
          </Secao>

          <Secao titulo="5. Cancelamento e reembolso">
            <ul className="list-disc pl-5 space-y-2">
              <li>O Cliente pode cancelar a assinatura a qualquer momento pelo painel ou solicitando ao suporte.</li>
              <li>Conforme o Código de Defesa do Consumidor, há direito de arrependimento em até 7 dias da primeira contratação online, com reembolso integral.</li>
              <li>Após esse prazo, não há reembolso de mensalidades já pagas; o acesso permanece ativo até o fim do ciclo vigente.</li>
            </ul>
          </Secao>

          <Secao titulo="6. Uso aceitável">
            É proibido utilizar a Plataforma para fins ilícitos, violar direitos de terceiros,
            tentar acessar áreas restritas, fazer engenharia reversa do software, sobrecarregar
            a infraestrutura ou inserir dados de terceiros sem base legal adequada. O
            descumprimento pode resultar em suspensão ou encerramento da conta.
          </Secao>

          <Secao titulo="7. Propriedade intelectual">
            Todo o código, marca, layout, conteúdo e funcionalidades da Plataforma são de
            propriedade exclusiva da FJN Tecnologia. A contratação não transfere qualquer
            direito de propriedade — concede apenas licença de uso pessoal e intransferível
            pelo período de vigência da assinatura.
          </Secao>

          <Secao titulo="8. Dados do Cliente">
            Os dados cadastrados pelo Cliente (alunos, pagamentos, biometria, etc.) permanecem
            de titularidade do Cliente. A FJN Tecnologia atua como operadora desses dados,
            conforme a <Link href="/privacidade" className="text-cyan hover:underline">Política
            de Privacidade</Link>. O Cliente pode exportar ou solicitar exclusão dos seus
            dados em <Link href="/excluir-conta" className="text-cyan hover:underline">/excluir-conta</Link>.
          </Secao>

          <Secao titulo="9. Disponibilidade e suporte">
            A Plataforma é fornecida “como está”, com esforço razoável para manter alta
            disponibilidade. Não há garantia de funcionamento ininterrupto. O suporte oficial
            é prestado por e-mail e WhatsApp, em horário comercial, de segunda a sexta-feira.
          </Secao>

          <Secao titulo="10. Limitação de responsabilidade">
            Na máxima extensão permitida em lei, a FJN Tecnologia não responde por lucros
            cessantes, danos indiretos ou perdas decorrentes de mau uso da Plataforma, falhas
            de internet do Cliente, indisponibilidade de serviços terceiros (Stripe, provedor
            de e-mail, etc.) ou inserção de dados incorretos por usuários do Cliente.
          </Secao>

          <Secao titulo="11. Alterações destes termos">
            Estes termos podem ser atualizados periodicamente. A versão vigente sempre
            estará disponível nesta página com a data da última atualização. Mudanças
            relevantes serão comunicadas por e-mail ao titular da conta.
          </Secao>

          <Secao titulo="12. Lei aplicável e foro">
            Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro da Comarca
            de Cuiabá – MT, com renúncia a qualquer outro, por mais privilegiado que seja,
            para dirimir conflitos oriundos deste contrato.
          </Secao>

          <Secao titulo="13. Contato">
            <div className="flex items-center gap-2 text-white">
              <Mail size={14} className="text-cyan" />
              <a href="mailto:contato@gymflowgestor.com.br" className="hover:text-cyan transition-colors">
                contato@gymflowgestor.com.br
              </a>
            </div>
          </Secao>
        </div>
      </div>
    </div>
  )
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-white font-bold text-lg mb-3">{titulo}</h2>
      <div>{children}</div>
    </section>
  )
}
