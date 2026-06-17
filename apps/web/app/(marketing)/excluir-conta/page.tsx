import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Mail, MessageCircle, Trash2, Clock, ShieldCheck, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Excluir minha conta — GymFlow Gestor',
  description: 'Solicite a exclusão da sua conta e dos seus dados pessoais do GymFlow Gestor.',
}

const ATUALIZADO_EM = '17 de junho de 2026'

export default function ExcluirContaPage() {
  return (
    <div className="min-h-screen bg-dark text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Voltar para o site
        </Link>

        <div className="flex items-center gap-2 text-red text-xs uppercase tracking-widest mb-3">
          <Trash2 size={14} /> Direito de exclusão · LGPD art. 18
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight mb-2">
          Excluir minha conta e meus dados
        </h1>
        <p className="text-sm text-muted mb-12">
          Última atualização: {ATUALIZADO_EM}
        </p>

        <div className="space-y-10 text-sm leading-relaxed text-muted">
          <Secao titulo="Como solicitar a exclusão">
            <p className="mb-4">
              Você pode pedir a exclusão completa da sua conta e dos seus dados pessoais por
              qualquer um dos canais abaixo. <strong className="text-white">Não é necessário
              ter assinatura ativa</strong> — basta enviar a solicitação.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <a
                href="mailto:contato@gymflowgestor.com.br?subject=Solicitação%20de%20exclusão%20de%20conta&body=Olá%2C%0A%0ASou%20titular%20da%20conta%20associada%20ao%20e-mail%3A%20___________%0A%0ASolicito%20a%20exclusão%20completa%20da%20minha%20conta%20e%20dos%20meus%20dados%20pessoais%20conforme%20a%20LGPD%20art.%2018.%0A%0AObrigado."
                className="card p-5 hover:border-cyan/40 transition-colors group"
              >
                <Mail size={20} className="text-cyan mb-3" />
                <div className="font-bold text-white mb-1 group-hover:text-cyan transition-colors">
                  Por e-mail
                </div>
                <div className="text-xs text-muted">
                  contato@gymflowgestor.com.br
                </div>
              </a>

              <a
                href="https://wa.me/5565996952828?text=Solicito%20a%20exclus%C3%A3o%20da%20minha%20conta%20do%20GymFlow%20Gestor.%20E-mail%20cadastrado%3A%20___________"
                target="_blank"
                rel="noopener noreferrer"
                className="card p-5 hover:border-green/40 transition-colors group"
              >
                <MessageCircle size={20} className="text-green mb-3" />
                <div className="font-bold text-white mb-1 group-hover:text-green transition-colors">
                  Por WhatsApp
                </div>
                <div className="text-xs text-muted">
                  (65) 99695-2828
                </div>
              </a>
            </div>

            <div className="rounded-xl bg-cyan/5 border border-cyan/30 p-4 text-xs">
              <strong className="text-white">Inclua na solicitação:</strong> nome completo
              do titular da conta e o e-mail cadastrado. Pediremos confirmação por e-mail
              para evitar exclusões indevidas.
            </div>
          </Secao>

          <Secao titulo="O que será excluído">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Dados de cadastro do gestor (nome, e-mail, telefone, senha).</li>
              <li>Dados dos alunos cadastrados pela academia.</li>
              <li>Templates biométricos faciais (excluídos imediatamente).</li>
              <li>Histórico de uso, logs de acesso e configurações.</li>
              <li>Conta de cobrança no Stripe (cancelamento + exclusão de cliente).</li>
            </ul>
          </Secao>

          <Secao titulo="O que será retido (e por quanto tempo)">
            <p className="mb-3">
              Por exigência legal, alguns dados precisam ser mantidos mesmo após o pedido
              de exclusão:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-white">Registros financeiros e fiscais:</strong> mantidos
                por até 5 anos (Receita Federal — art. 195 CTN).
              </li>
              <li>
                <strong className="text-white">Logs de segurança mínimos:</strong> mantidos por
                até 6 meses (Marco Civil da Internet — Lei 12.965/2014).
              </li>
              <li>
                <strong className="text-white">Dados anonimizados:</strong> métricas agregadas
                sem possibilidade de re-identificação podem ser mantidas para fins estatísticos.
              </li>
            </ul>
            <p className="mt-3">
              Após o vencimento desses prazos, os dados são apagados em definitivo.
            </p>
          </Secao>

          <Secao titulo="Prazo de processamento">
            <div className="flex items-start gap-3 rounded-xl bg-dark-card2 border border-dark-border p-4 mb-3">
              <Clock size={18} className="text-cyan flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white mb-1">Até 15 dias úteis</div>
                <div className="text-xs">
                  Confirmação da exclusão por e-mail. A maioria dos pedidos é atendida em até
                  48 horas.
                </div>
              </div>
            </div>
          </Secao>

          <Secao titulo="Atenção — ação irreversível">
            <div className="flex items-start gap-3 rounded-xl bg-orange/5 border border-orange/30 p-4">
              <AlertTriangle size={18} className="text-orange flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                Após a exclusão confirmada, <strong className="text-white">não é possível
                recuperar a conta nem os dados</strong>. Se desejar manter o histórico dos
                seus alunos, exporte-o antes de pedir a exclusão (Configurações → Exportar
                dados, ou solicite pelo suporte).
              </div>
            </div>
          </Secao>

          <Secao titulo="Aluno da academia? Fale com sua academia">
            Se você é <strong className="text-white">aluno</strong> e seus dados estão em
            uma academia que usa o GymFlow Gestor, a exclusão deve ser solicitada diretamente
            à academia, que é a controladora dos seus dados. Caso a academia não atenda em
            tempo razoável, escreva para <a href="mailto:contato@gymflowgestor.com.br" className="text-cyan hover:underline">contato@gymflowgestor.com.br</a> que
            intermediamos a solicitação.
          </Secao>

          <Secao titulo="Base legal">
            <div className="flex items-start gap-3 text-xs">
              <ShieldCheck size={16} className="text-cyan flex-shrink-0 mt-0.5" />
              <div>
                Este procedimento atende ao <strong className="text-white">art. 18 da Lei
                Geral de Proteção de Dados (Lei 13.709/2018)</strong> e às políticas de
                exclusão de dados de usuários da Google Play e da Apple App Store.
              </div>
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
