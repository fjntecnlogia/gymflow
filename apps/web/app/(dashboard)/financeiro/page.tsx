'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  DollarSign, AlertTriangle, Clock, Plus, CheckCircle2, X,
  MessageCircle, ChevronDown, Search, TrendingUp, RefreshCw,
  Receipt, Banknote, CreditCard, QrCode as QrIcon, BarChart3, List
} from 'lucide-react'
import { api, getApiError } from '@/lib/api'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { VisaoGeralFinanceiro } from '@/components/financeiro/VisaoGeralFinanceiro'
dayjs.locale('pt-br')

const METODOS = [
  { value: 'DINHEIRO',       label: 'Dinheiro',       icon: '💵' },
  { value: 'PIX',            label: 'PIX',             icon: '⚡' },
  { value: 'CARTAO_DEBITO',  label: 'Cartão Débito',  icon: '💳' },
  { value: 'CARTAO_CREDITO', label: 'Cartão Crédito', icon: '💳' },
  { value: 'BOLETO',         label: 'Boleto',          icon: '📄' },
]

const STATUS_STYLE: Record<string, string> = {
  PAGO:     'bg-green/10 text-green',
  PENDENTE: 'bg-orange/10 text-orange',
  VENCIDO:  'bg-red/10 text-red',
  CANCELADO:'bg-dark-border text-muted',
  ESTORNADO:'bg-purple/10 text-purple',
}

export default function FinanceiroPage() {
  const [resumo, setResumo]         = useState<any>(null)
  const [pagamentos, setPagamentos] = useState<any[]>([])
  const [alunos, setAlunos]         = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [busca, setBusca]           = useState('')
  const [modal, setModal]           = useState(false)
  const [processando, setProcessando] = useState<string | null>(null)
  const [aba, setAba]               = useState<'visao' | 'pagamentos'>('visao')

  const [form, setForm] = useState({
    alunoId: '', valor: '', metodo: 'DINHEIRO',
    descricao: 'Mensalidade', dataVencimento: dayjs().format('YYYY-MM-DD'),
    jaFoiPago: true,
  })

  const carregar = useCallback(async () => {
    try {
      const [resRes, pagRes, alunosRes] = await Promise.all([
        api.get('/pagamentos/resumo'),
        api.get(`/pagamentos?limit=50${filtroStatus ? `&status=${filtroStatus}` : ''}`),
        api.get('/alunos?limit=100'),
      ])
      setResumo(resRes.data)
      setPagamentos(pagRes.data)
      setAlunos(alunosRes.data.alunos ?? [])
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setLoading(false)
    }
  }, [filtroStatus])

  useEffect(() => { carregar() }, [carregar])

  async function registrar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.alunoId || !form.valor) return toast.error('Aluno e valor são obrigatórios')
    setProcessando('novo')
    try {
      await api.post('/pagamentos/manual', {
        alunoId: form.alunoId,
        valor: parseFloat(form.valor),
        metodo: form.metodo,
        descricao: form.descricao,
        dataVencimento: new Date(form.dataVencimento + 'T12:00:00Z').toISOString(),
        jaFoiPago: form.jaFoiPago,
      })
      toast.success(form.jaFoiPago ? 'Pagamento registrado como PAGO!' : 'Cobrança registrada!')
      setModal(false)
      setForm({ alunoId: '', valor: '', metodo: 'DINHEIRO', descricao: 'Mensalidade', dataVencimento: dayjs().format('YYYY-MM-DD'), jaFoiPago: true })
      carregar()
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setProcessando(null)
    }
  }

  async function marcarPago(id: string) {
    setProcessando(id)
    try {
      await api.patch(`/pagamentos/${id}/pagar`)
      toast.success('Pagamento confirmado! ✅')
      carregar()
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setProcessando(null)
    }
  }

  async function cobrarWhatsApp(pagamento: any) {
    if (!pagamento.aluno?.telefone) return toast.error('Aluno sem telefone cadastrado')
    setProcessando('wpp_' + pagamento.id)
    try {
      await api.post(`/notificacoes/whatsapp/cobrar/${pagamento.alunoId}`)
      toast.success('Cobrança enviada no WhatsApp! 💬')
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setProcessando(null)
    }
  }

  const pagamentosFiltrados = pagamentos.filter(p =>
    !busca || p.aluno?.nome?.toLowerCase().includes(busca.toLowerCase())
  )

  // Agrupar por mês para o gráfico
  const receitaPorMes = pagamentos
    .filter(p => p.status === 'PAGO')
    .reduce((acc: Record<string, number>, p) => {
      const mes = dayjs(p.dataPagamento).format('MMM/YY')
      acc[mes] = (acc[mes] ?? 0) + Number(p.valor)
      return acc
    }, {})
  const maxReceita = Math.max(...Object.values(receitaPorMes), 1)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Financeiro</h1>
          <p className="text-sm text-muted">{dayjs().format('MMMM [de] YYYY')}</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="gradient-btn text-dark font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> Registrar Pagamento
        </button>
      </div>

      {/* Abas */}
      <div className="flex items-center gap-1 border-b border-dark-border">
        <button
          onClick={() => setAba('visao')}
          className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px inline-flex items-center gap-2 ${
            aba === 'visao'
              ? 'border-cyan text-cyan'
              : 'border-transparent text-muted hover:text-white'
          }`}
        >
          <BarChart3 size={14} /> Visão Geral
        </button>
        <button
          onClick={() => setAba('pagamentos')}
          className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px inline-flex items-center gap-2 ${
            aba === 'pagamentos'
              ? 'border-cyan text-cyan'
              : 'border-transparent text-muted hover:text-white'
          }`}
        >
          <List size={14} /> Pagamentos
        </button>
      </div>

      {/* Aba: Visão Geral */}
      {aba === 'visao' && <VisaoGeralFinanceiro />}

      {/* Aba: Pagamentos (conteúdo legado abaixo) */}
      {aba === 'pagamentos' && <>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 border-green/20 bg-green/5">
          <DollarSign size={18} className="text-green mb-2" />
          <div className="text-2xl font-bold font-display text-green">
            {resumo ? `R$ ${Number(resumo.receitaMes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '–'}
          </div>
          <div className="text-sm font-semibold mt-0.5">Receita do Mês</div>
          <div className="text-xs text-muted">pagamentos confirmados</div>
        </div>
        <div className="card p-5">
          <AlertTriangle size={18} className="text-red mb-2" />
          <div className="text-2xl font-bold font-display text-red">{resumo?.inadimplentes ?? '–'}</div>
          <div className="text-sm font-semibold mt-0.5">Inadimplentes</div>
          <div className="text-xs text-muted">alunos com pagamento atrasado</div>
        </div>
        <div className="card p-5">
          <Clock size={18} className="text-orange mb-2" />
          <div className="text-2xl font-bold font-display text-orange">
            {resumo ? `R$ ${Number(resumo.valorPendente).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '–'}
          </div>
          <div className="text-sm font-semibold mt-0.5">Valor Pendente</div>
          <div className="text-xs text-muted">{resumo?.qtdPendente ?? 0} cobrança(s) em aberto</div>
        </div>
      </div>

      {/* Gráfico de receita */}
      {Object.keys(receitaPorMes).length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-cyan" /> Receita por Mês
          </h3>
          <div className="flex items-end gap-3 h-24">
            {Object.entries(receitaPorMes).slice(-6).map(([mes, valor]) => (
              <div key={mes} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className="w-full bg-cyan/40 hover:bg-cyan rounded-t-sm transition-colors cursor-default"
                  style={{ height: `${(valor / maxReceita) * 100}%` }}
                />
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-dark-card border border-dark-border text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                  R$ {Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-xs text-muted">{mes}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros + busca */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="w-full bg-dark-card border border-dark-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-cyan outline-none"
            placeholder="Buscar por aluno..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {[
            { value: '', label: 'Todos' },
            { value: 'PENDENTE', label: 'Pendente' },
            { value: 'PAGO', label: 'Pago' },
            { value: 'VENCIDO', label: 'Vencido' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFiltroStatus(f.value)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${filtroStatus === f.value ? 'bg-cyan/15 text-cyan border border-cyan/30' : 'bg-dark-card border border-dark-border text-muted hover:text-white'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de pagamentos */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-dark-border flex items-center justify-between">
          <h3 className="font-semibold text-sm">
            {pagamentosFiltrados.length} pagamento{pagamentosFiltrados.length !== 1 ? 's' : ''}
          </h3>
          <button onClick={carregar} className="text-muted hover:text-white transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-muted text-sm">Carregando...</div>
        ) : pagamentosFiltrados.length === 0 ? (
          <div className="py-12 text-center">
            <Receipt size={36} className="mx-auto mb-3 text-muted opacity-30" />
            <p className="text-muted text-sm">Nenhum pagamento encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  {['Aluno', 'Valor', 'Método', 'Vencimento', 'Pago em', 'Status', 'Ações'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagamentosFiltrados.map(p => {
                  const vencido = p.status === 'PENDENTE' && dayjs().isAfter(dayjs(p.dataVencimento))
                  const statusEfetivo = vencido ? 'VENCIDO' : p.status
                  return (
                    <tr key={p.id} className="border-b border-dark-border/40 hover:bg-white/2 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{p.aluno?.nome}</div>
                        {p.descricao && <div className="text-xs text-muted">{p.descricao}</div>}
                      </td>
                      <td className="px-4 py-3 font-bold text-green">R$ {Number(p.valor).toFixed(2)}</td>
                      <td className="px-4 py-3 text-muted text-xs">
                        {METODOS.find(m => m.value === p.metodo)?.icon} {METODOS.find(m => m.value === p.metodo)?.label ?? p.metodo}
                      </td>
                      <td className={`px-4 py-3 text-xs font-semibold ${vencido ? 'text-red' : 'text-muted'}`}>
                        {dayjs(p.dataVencimento).format('DD/MM/YYYY')}
                        {vencido && <div className="text-red text-xs">ATRASADO</div>}
                      </td>
                      <td className="px-4 py-3 text-muted text-xs">
                        {p.dataPagamento ? dayjs(p.dataPagamento).format('DD/MM/YYYY') : '–'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_STYLE[statusEfetivo] ?? ''}`}>
                          {statusEfetivo}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {(p.status === 'PENDENTE' || vencido) && (
                            <>
                              <button
                                onClick={() => marcarPago(p.id)}
                                disabled={processando === p.id}
                                className="flex items-center gap-1 text-xs text-green hover:text-green/80 transition-colors disabled:opacity-50"
                              >
                                {processando === p.id
                                  ? <RefreshCw size={11} className="animate-spin" />
                                  : <CheckCircle2 size={11} />}
                                Pago
                              </button>
                              <button
                                onClick={() => cobrarWhatsApp(p)}
                                disabled={!!processando}
                                className="flex items-center gap-1 text-xs text-cyan hover:text-cyan/80 transition-colors disabled:opacity-50"
                              >
                                <MessageCircle size={11} /> WhatsApp
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      </>}
      {/* /aba pagamentos */}

      {/* Modal Registrar Pagamento */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg flex items-center gap-2">
                <Receipt size={18} className="text-cyan" /> Registrar Pagamento
              </h2>
              <button onClick={() => setModal(false)}><X size={18} className="text-muted hover:text-white" /></button>
            </div>

            <form onSubmit={registrar} className="space-y-3">
              {/* Aluno */}
              <div>
                <label className="text-xs text-muted mb-1 block">Aluno *</label>
                <select
                  className="input w-full"
                  value={form.alunoId}
                  onChange={e => setForm(f => ({ ...f, alunoId: e.target.value }))}
                  required
                >
                  <option value="">Selecione o aluno</option>
                  {alunos.map(a => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </select>
              </div>

              {/* Valor + Método */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted mb-1 block">Valor (R$) *</label>
                  <input
                    className="input w-full"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0,00"
                    value={form.valor}
                    onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Método</label>
                  <select
                    className="input w-full"
                    value={form.metodo}
                    onChange={e => setForm(f => ({ ...f, metodo: e.target.value }))}
                  >
                    {METODOS.map(m => (
                      <option key={m.value} value={m.value}>{m.icon} {m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descrição + Vencimento */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted mb-1 block">Descrição</label>
                  <input
                    className="input w-full"
                    value={form.descricao}
                    onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Vencimento</label>
                  <input
                    className="input w-full"
                    type="date"
                    value={form.dataVencimento}
                    onChange={e => setForm(f => ({ ...f, dataVencimento: e.target.value }))}
                  />
                </div>
              </div>

              {/* Já foi pago? */}
              <label className="flex items-center gap-3 p-3 rounded-xl border border-dark-border hover:border-cyan/30 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={form.jaFoiPago}
                  onChange={e => setForm(f => ({ ...f, jaFoiPago: e.target.checked }))}
                  className="w-4 h-4 accent-cyan"
                />
                <div>
                  <div className="text-sm font-semibold">Já foi pago</div>
                  <div className="text-xs text-muted">Marcar como confirmado agora</div>
                </div>
              </label>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl border border-dark-border text-sm font-semibold hover:border-muted">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processando === 'novo'}
                  className="flex-1 gradient-btn text-dark py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                >
                  {processando === 'novo' ? 'Salvando...' : form.jaFoiPago ? 'Confirmar Pagamento' : 'Criar Cobrança'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
