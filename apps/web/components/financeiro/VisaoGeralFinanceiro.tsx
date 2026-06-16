'use client'

import { useEffect, useState } from 'react'
import {
  TrendingUp, TrendingDown, AlertTriangle, DollarSign,
  Calendar, Activity, Wallet, RefreshCw, MessageCircle,
} from 'lucide-react'
import { api } from '@/lib/api'
import dayjs from 'dayjs'

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
}

interface DRE {
  mes: string
  receitaBruta: number
  receitaAnt: number
  variacaoMoM: number
  qtdRecebidos: number
  pendente: number
  qtdPendente: number
  vencido: number
  qtdVencido: number
  inadimplenciaTotal: number
  resultadoLiquido: number
}

interface FluxoCaixa {
  totalEntradas: number
  mediaEntradaDiaria: number
  serie: { dia: string; entrada: number; saldo: number }[]
}

interface PrevisaoMrr {
  mrrPrevisto: number
  alunosAtivos: number
  ticketMedio: number
  arrPrevisto: number
}

interface Inadimplente {
  pagamentoId: string
  alunoId: string
  nome: string
  telefone: string
  valor: number
  dataVencimento: string
  diasAtraso: number
  descricao: string
}

export function VisaoGeralFinanceiro() {
  const [dre, setDre] = useState<DRE | null>(null)
  const [fluxo, setFluxo] = useState<FluxoCaixa | null>(null)
  const [previsao, setPrevisao] = useState<PrevisaoMrr | null>(null)
  const [inadimplentes, setInadimplentes] = useState<Inadimplente[]>([])
  const [custos, setCustos] = useState(0)
  const [loading, setLoading] = useState(true)

  async function carregar() {
    setLoading(true)
    try {
      const [d, f, p, i] = await Promise.all([
        api.get('/pagamentos/dre'),
        api.get('/pagamentos/fluxo-caixa?dias=30'),
        api.get('/pagamentos/previsao-mrr'),
        api.get('/pagamentos/inadimplentes'),
      ])
      setDre(d.data)
      setFluxo(f.data)
      setPrevisao(p.data)
      setInadimplentes(i.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  if (loading || !dre || !fluxo || !previsao) {
    return <div className="card p-12 text-center text-sm text-muted">Carregando...</div>
  }

  const maxEntrada = Math.max(...fluxo.serie.map((d) => d.entrada), 1)
  const resultadoLiquido = dre.resultadoLiquido - custos
  const positivo = resultadoLiquido >= 0

  return (
    <div className="space-y-6">
      {/* ─── Refresh ─── */}
      <div className="flex justify-end">
        <button
          onClick={carregar}
          disabled={loading}
          className="text-xs border border-dark-border hover:border-muted text-white px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Atualizar
        </button>
      </div>

      {/* ─── DRE Simplificado ─── */}
      <div className="card p-6">
        <h3 className="font-semibold mb-1 flex items-center gap-2">
          <DollarSign size={16} className="text-green" /> DRE Simplificado — {dayjs(dre.mes + '-01').format('MMMM/YYYY')}
        </h3>
        <p className="text-xs text-muted mb-5">
          Demonstrativo do Resultado do Exercício do mês corrente
        </p>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-dark-border">
            <span className="text-muted">(+) Receita bruta ({dre.qtdRecebidos} pagamentos)</span>
            <span className="font-bold text-green">{brl(dre.receitaBruta)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-dark-border">
            <span className="text-muted">(–) Inadimplência ({dre.qtdVencido + dre.qtdPendente} faturas)</span>
            <span className="font-semibold text-orange">{brl(dre.inadimplenciaTotal)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-dark-border">
            <label className="text-muted flex items-center gap-2">
              (–) Custos operacionais
              <input
                type="number"
                min="0"
                value={custos}
                onChange={(e) => setCustos(Number(e.target.value) || 0)}
                className="bg-dark-card2 border border-dark-border rounded px-2 py-1 text-sm w-28 text-white"
                placeholder="0"
              />
            </label>
            <span className="font-semibold text-red">{brl(custos)}</span>
          </div>
          <div className="flex justify-between items-center pt-3 mt-2 border-t-2 border-dark-border">
            <span className="font-bold">(=) Resultado líquido</span>
            <span className={`font-bold text-lg ${positivo ? 'text-green' : 'text-red'}`}>
              {brl(resultadoLiquido)}
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 text-xs">
          {dre.variacaoMoM >= 0 ? (
            <span className="text-green inline-flex items-center gap-1">
              <TrendingUp size={11} /> +{dre.variacaoMoM.toFixed(1)}%
            </span>
          ) : (
            <span className="text-red inline-flex items-center gap-1">
              <TrendingDown size={11} /> {dre.variacaoMoM.toFixed(1)}%
            </span>
          )}
          <span className="text-muted">vs mês anterior ({brl(dre.receitaAnt)})</span>
        </div>
      </div>

      {/* ─── 2 colunas: Previsão MRR + Fluxo de Caixa resumo ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold mb-1 flex items-center gap-2">
            <Calendar size={16} className="text-cyan" /> Previsão de Receita Mensal
          </h3>
          <p className="text-xs text-muted mb-5">
            Baseado nas matrículas ativas
          </p>
          <div className="font-display text-3xl font-black text-cyan mb-1">
            {brl(previsao.mrrPrevisto)}
          </div>
          <p className="text-xs text-muted mb-4">por mês recorrente</p>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-dark-border">
            <div>
              <div className="text-xs text-muted">Alunos ativos</div>
              <div className="font-bold text-white">{previsao.alunosAtivos}</div>
            </div>
            <div>
              <div className="text-xs text-muted">Ticket médio</div>
              <div className="font-bold text-white">{brl(previsao.ticketMedio)}</div>
            </div>
            <div>
              <div className="text-xs text-muted">ARR</div>
              <div className="font-bold text-cyan">{brl(previsao.arrPrevisto)}</div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold mb-1 flex items-center gap-2">
            <Wallet size={16} className="text-green" /> Fluxo de Caixa (30 dias)
          </h3>
          <p className="text-xs text-muted mb-5">
            Total recebido nos últimos 30 dias
          </p>
          <div className="font-display text-3xl font-black text-green mb-1">
            {brl(fluxo.totalEntradas)}
          </div>
          <p className="text-xs text-muted mb-4">
            média de {brl(fluxo.mediaEntradaDiaria)}/dia
          </p>

          {/* Mini gráfico */}
          <div className="flex items-end gap-px h-12 pt-2 border-t border-dark-border">
            {fluxo.serie.map((d, i) => {
              const h = (d.entrada / maxEntrada) * 100
              return (
                <div
                  key={d.dia}
                  className="flex-1 bg-green/40 hover:bg-green rounded-sm transition-colors"
                  style={{ height: `${Math.max(h, 1)}%` }}
                  title={`${dayjs(d.dia).format('DD/MM')}: ${brl(d.entrada)}`}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── Inadimplentes ─── */}
      <div className={`card p-6 ${inadimplentes.length > 0 ? 'border-orange/30' : ''}`}>
        <h3 className="font-semibold mb-1 flex items-center gap-2">
          <AlertTriangle size={16} className={inadimplentes.length > 0 ? 'text-orange' : 'text-muted'} />
          Inadimplentes
        </h3>
        <p className="text-xs text-muted mb-5">
          {inadimplentes.length === 0
            ? 'Nenhum aluno em atraso. Parabéns!'
            : `${inadimplentes.length} alunos com pagamentos em atraso. Total: ${brl(inadimplentes.reduce((s, i) => s + i.valor, 0))}`}
        </p>

        {inadimplentes.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted">
            🎉 Sua academia está 100% em dia
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted border-b border-dark-border">
                  <th className="text-left py-2 font-medium">Aluno</th>
                  <th className="text-left py-2 font-medium">Vencimento</th>
                  <th className="text-right py-2 font-medium">Valor</th>
                  <th className="text-right py-2 font-medium">Atraso</th>
                  <th className="text-right py-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {inadimplentes.slice(0, 20).map((i) => {
                  const tel = i.telefone?.replace(/\D/g, '')
                  const msg = encodeURIComponent(
                    `Olá ${i.nome.split(' ')[0]}, sua mensalidade de ${brl(i.valor)} venceu em ${dayjs(i.dataVencimento).format('DD/MM')}. Posso te enviar o link de pagamento?`,
                  )
                  return (
                    <tr key={i.pagamentoId} className="border-b border-dark-border/30 hover:bg-dark-card2/50">
                      <td className="py-3">
                        <div className="font-semibold">{i.nome}</div>
                        <div className="text-xs text-muted">{i.telefone}</div>
                      </td>
                      <td className="py-3 text-muted">
                        {dayjs(i.dataVencimento).format('DD/MM/YYYY')}
                      </td>
                      <td className="py-3 text-right font-bold text-orange">{brl(i.valor)}</td>
                      <td className="py-3 text-right">
                        <span className={`font-semibold ${i.diasAtraso > 30 ? 'text-red' : 'text-orange'}`}>
                          {i.diasAtraso}d
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {tel && (
                          <a
                            href={`https://wa.me/55${tel}?text=${msg}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-green hover:text-white border border-green/30 hover:border-green rounded-lg px-2.5 py-1 transition-colors"
                          >
                            <MessageCircle size={11} /> Cobrar
                          </a>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {inadimplentes.length > 20 && (
              <p className="text-xs text-muted text-center mt-3">
                +{inadimplentes.length - 20} alunos não mostrados — use a aba "Pagamentos" pra ver todos.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
