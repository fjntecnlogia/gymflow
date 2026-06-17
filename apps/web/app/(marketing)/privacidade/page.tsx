import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Política de Privacidade — GymFlow Gestor',
  description: 'Como o GymFlow Gestor coleta, usa e protege seus dados pessoais (LGPD).',
}

const ATUALIZADO_EM = '17 de junho de 2026'

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-dark text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Voltar para o site
        </Link>

        <div className="flex items-center gap-2 text-cyan text-xs uppercase tracking-widest mb-3">
          <ShieldCheck size={14} /> LGPD · Lei 13.709/2018
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight mb-2">
          Política de Privacidade
        </h1>
        <p className="text-sm text-muted mb-12">
          Última atualização: {ATUALIZADO_EM}
        </p>

        <div className="space-y-10 text-sm leading-relaxed text-muted">
          <Secao titulo="1. Quem somos">
            O <strong className="text-white">GymFlow Gestor</strong> é operado pela
            <strong className="text-white"> FJN Tecnologia</strong>, controladora dos dados
            pessoais tratados nesta Plataforma. Esta política descreve quais dados coletamos,
            por que coletamos, como usamos e quais são seus direitos de titular conforme a
            Lei Geral de Proteção de Dados (LGPD).
          </Secao>

          <Secao titulo="2. Dados que coletamos">
            <p className="mb-3"><strong className="text-white">Do gestor / dono da academia:</strong></p>
            <ul className="list-disc pl-5 space-y-1.5 mb-4">
              <li>Nome, e-mail, telefone, senha (armazenada com hash bcrypt).</li>
              <li>Dados de cobrança processados pelo Stripe (não armazenamos número de cartão).</li>
              <li>Logs de acesso (IP, navegador, data/hora) para segurança.</li>
            </ul>
            <p className="mb-3"><strong className="text-white">Dos alunos cadastrados pela academia:</strong></p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Nome, CPF, data de nascimento, telefone, e-mail, endereço.</li>
              <li>Plano contratado, histórico financeiro, frequência e horários de acesso.</li>
              <li>Foto e template biométrico facial (quando a academia opta pelo controle por biometria).</li>
            </ul>
          </Secao>

          <Secao titulo="3. Bases legais (art. 7º LGPD)">
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-white">Execução de contrato:</strong> para entregar o serviço contratado.</li>
              <li><strong className="text-white">Obrigação legal:</strong> para emitir notas, atender ao fisco e à legislação trabalhista.</li>
              <li><strong className="text-white">Consentimento:</strong> para uso de biometria facial e envio de comunicações de marketing (opt-in).</li>
              <li><strong className="text-white">Legítimo interesse:</strong> para segurança, prevenção a fraude e melhoria do produto.</li>
            </ul>
          </Secao>

          <Secao titulo="4. Como usamos os dados">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Manter sua conta ativa e fornecer as funcionalidades contratadas.</li>
              <li>Processar pagamentos e enviar recibos.</li>
              <li>Permitir controle de acesso por biometria, QR code ou cartão.</li>
              <li>Enviar comunicações operacionais (cobrança, suporte, alertas).</li>
              <li>Gerar relatórios estatísticos para o gestor (anonimizados quando agregados).</li>
            </ul>
          </Secao>

          <Secao titulo="5. Compartilhamento com terceiros">
            Compartilhamos apenas o estritamente necessário, com operadores que seguem padrão
            equivalente ao nosso:
            <ul className="list-disc pl-5 space-y-1.5 mt-3">
              <li><strong className="text-white">Stripe:</strong> processamento de pagamentos e assinaturas.</li>
              <li><strong className="text-white">Resend:</strong> envio de e-mails transacionais.</li>
              <li><strong className="text-white">CompreFace (auto-hospedado):</strong> reconhecimento facial; o template biométrico fica em infraestrutura própria.</li>
              <li><strong className="text-white">Railway, Vercel, Cloudflare:</strong> hospedagem, CDN e DNS.</li>
              <li><strong className="text-white">Autoridades públicas:</strong> apenas mediante ordem judicial ou requisição legal.</li>
            </ul>
            Não vendemos seus dados a terceiros para fins de marketing. Jamais.
          </Secao>

          <Secao titulo="6. Tempo de retenção">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Dados de cadastro: enquanto a conta estiver ativa.</li>
              <li>Após cancelamento: até 30 dias para eventual reativação; depois são apagados ou anonimizados.</li>
              <li>Dados financeiros e fiscais: retidos por até 5 anos por obrigação legal (Receita Federal).</li>
              <li>Templates biométricos: excluídos imediatamente quando o aluno é removido ou solicita exclusão.</li>
            </ul>
          </Secao>

          <Secao titulo="7. Seus direitos como titular (art. 18 LGPD)">
            Você pode, a qualquer momento, solicitar:
            <ul className="list-disc pl-5 space-y-1.5 mt-3">
              <li>Confirmação de que tratamos seus dados.</li>
              <li>Acesso aos dados que mantemos sobre você.</li>
              <li>Correção de dados incompletos ou desatualizados.</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários.</li>
              <li>Portabilidade dos dados em formato estruturado.</li>
              <li>Revogação do consentimento.</li>
              <li><strong className="text-white">Exclusão completa da conta</strong> em <Link href="/excluir-conta" className="text-cyan hover:underline">/excluir-conta</Link>.</li>
            </ul>
            Solicitações são atendidas em até 15 dias.
          </Secao>

          <Secao titulo="8. Segurança">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Tráfego sempre em HTTPS/TLS.</li>
              <li>Senhas armazenadas com hash bcrypt (custo 10+).</li>
              <li>Tokens de sessão JWT com expiração de 30 dias.</li>
              <li>Banco de dados em rede privada, com backup diário.</li>
              <li>Controle de acesso por perfil (RBAC) dentro da Plataforma.</li>
            </ul>
          </Secao>

          <Secao titulo="9. Cookies">
            Utilizamos cookies essenciais (login, sessão) e cookies de analytics (Google
            Analytics 4) para entender o uso agregado. Você pode bloquear cookies no
            navegador — funcionalidades como login podem ficar limitadas.
          </Secao>

          <Secao titulo="10. Crianças e adolescentes">
            A Plataforma não é destinada a menores de 13 anos. Cadastros de adolescentes
            (alunos da academia) devem ser feitos pelos responsáveis legais ou pela própria
            academia mediante autorização documentada.
          </Secao>

          <Secao titulo="11. Alterações nesta política">
            Esta política pode ser atualizada periodicamente. Mudanças relevantes serão
            comunicadas por e-mail ao titular da conta com 15 dias de antecedência.
          </Secao>

          <Secao titulo="12. Encarregado e contato (DPO)">
            Para exercer seus direitos ou tirar dúvidas:
            <div className="flex items-center gap-2 text-white mt-3">
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
