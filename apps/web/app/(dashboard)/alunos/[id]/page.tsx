'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, QrCode, Phone, Mail, User, Calendar, CreditCard,
  ShieldCheck, ShieldX, Clock, Printer, Camera, CheckCircle2,
  XCircle, AlertCircle, UserCheck, TrendingUp, BarChart2, Flame
} from 'lucide-react'
import { api } from '@/lib/api'
import { mascaraTelefone, mascaraCPF } from '@/lib/masks'
import { CadastrarFaceModal } from '@/components/alunos/CadastrarFaceModal'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.locale('pt-br')
dayjs.extend(relativeTime)

interface Aluno {
  id: string
  nome: string
  email?: string
  telefone: string
  cpf?: string
  dataNascimento?: string
  fotoUrl?: string
  faceId?: string
  status: string
  qrCodeToken: string
  observacoes?: string
  criadoEm: string
  matriculas: any[]
  acessos: any[]
  pagamentos: any[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  ATIVO:       { label: 'Ativo',        color: 'text-green bg-green/10 border-green/20',      icon: CheckCircle2 },
  INADIMPLENTE:{ label: 'Inadimplente', color: 'text-red bg-red/10 border-red/20',            icon: AlertCircle },
  SUSPENSO:    { label: 'Suspenso',     color: 'text-orange bg-orange/10 border-orange/20',   icon: XCircle },
  CANCELADO:   { label: 'Cancelado',    color: 'text-muted bg-dark-border border-dark-border', icon: XCircle },
}

export default function PerfilAlunoPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const [aluno, setAluno] = useState<Aluno | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [faceModal, setFaceModal] = useState(false)
  const [abaTela, setAbaTela] = useState<'visao-geral' | 'frequencia' | 'acessos' | 'pagamentos'>('visao-geral')

  async function carregar() {
    try {
      const [alunoRes, qrRes] = await Promise.all([
        api.get(`/alunos/${id}`),
        api.get(`/alunos/${id}/qrcode`),
      ])
      setAluno(alunoRes.data)
      setQrCode(qrRes.data.qrCode)
    } catch {
      router.push('/alunos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [id])

  function imprimir() {
    window.print()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan" />
    </div>
  )

  if (!aluno) return null

  const mat = aluno.matriculas?.[0]
  const statusCfg = STATUS_CONFIG[aluno.status] ?? STATUS_CONFIG.ATIVO
  const StatusIcon = statusCfg.icon
  const vencido = mat && dayjs().isAfter(dayjs(mat.dataVencimento))

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Botão voltar */}
      <button
        onClick={() => router.push('/alunos')}
        className="flex items-center gap-2 text-muted hover:text-white text-sm transition-colors"
      >
        <ArrowLeft size={16} /> Voltar para Alunos
      </button>

      {/* ── Header do perfil ──────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar / Foto */}
          <div className="relative flex-shrink-0">
            {aluno.fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={aluno.fotoUrl}
                alt={aluno.nome}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-dark-border"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan to-blue flex items-center justify-center text-dark text-3xl font-black">
                {aluno.nome.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => setFaceModal(true)}
              title="Cadastrar biometria facial"
              className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-full border-2 border-dark flex items-center justify-center transition-colors ${aluno.faceId ? 'bg-green text-dark' : 'bg-dark-card text-muted hover:text-cyan'}`}
            >
              <Camera size={12} />
            </button>
          </div>

          {/* Info principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="font-display text-2xl font-black">{aluno.nome}</h1>
                <p className="text-muted text-sm mt-0.5">
                  Aluno desde {dayjs(aluno.criadoEm).format('MMMM [de] YYYY')}
                </p>
              </div>
              <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${statusCfg.color}`}>
                <StatusIcon size={12} /> {statusCfg.label}
              </span>
            </div>

            {/* Dados de contato */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {aluno.telefone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={14} className="text-muted flex-shrink-0" />
                  <span>{mascaraTelefone(aluno.telefone)}</span>
                </div>
              )}
              {aluno.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-muted flex-shrink-0" />
                  <span className="truncate">{aluno.email}</span>
                </div>
              )}
              {aluno.cpf && (
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard size={14} className="text-muted flex-shrink-0" />
                  <span>{mascaraCPF(aluno.cpf)}</span>
                </div>
              )}
              {aluno.dataNascimento && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-muted flex-shrink-0" />
                  <span>{dayjs(aluno.dataNascimento).format('DD/MM/YYYY')} ({dayjs().diff(dayjs(aluno.dataNascimento), 'year')} anos)</span>
                </div>
              )}
              {aluno.faceId && (
                <div className="flex items-center gap-2 text-sm text-green">
                  <Camera size={14} className="flex-shrink-0" />
                  <span>Biometria facial ativa</span>
                </div>
              )}
            </div>

            {aluno.observacoes && (
              <div className="mt-3 text-sm text-muted bg-dark-card border border-dark-border rounded-lg px-3 py-2">
                <span className="text-white font-medium">Obs: </span>{aluno.observacoes}
              </div>
            )}
          </div>
        </div>

        {/* Plano atual */}
        {mat && (
          <div className={`mt-5 flex items-center justify-between rounded-xl border p-4 ${vencido ? 'bg-red/5 border-red/20' : 'bg-cyan/5 border-cyan/20'}`}>
            <div className="flex items-center gap-3">
              <UserCheck size={18} className={vencido ? 'text-red' : 'text-cyan'} />
              <div>
                <div className="font-semibold text-sm">{mat.plano?.nome}</div>
                <div className="text-xs text-muted">
                  {mat.plano?.tipo} · R$ {Number(mat.plano?.valor ?? 0).toFixed(2)}/mês
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-bold ${vencido ? 'text-red' : 'text-cyan'}`}>
                {vencido ? 'VENCIDO' : 'Vence em ' + dayjs(mat.dataVencimento).fromNow()}
              </div>
              <div className="text-xs text-muted">{dayjs(mat.dataVencimento).format('DD/MM/YYYY')}</div>
            </div>
          </div>
        )}

        {!mat && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-orange/20 bg-orange/5 p-4">
            <AlertCircle size={18} className="text-orange" />
            <span className="text-sm text-orange font-medium">Sem matrícula ativa</span>
          </div>
        )}
      </div>

      {/* ── QR Code + Ações ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* QR Code */}
        <div className="card p-6 text-center print:border-0 print:shadow-none">
          <div className="flex items-center justify-center gap-2 mb-4">
            <QrCode size={16} className="text-cyan" />
            <h2 className="font-semibold text-sm">QR Code de Acesso</h2>
          </div>
          {qrCode ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="QR Code" className="w-48 h-48 mx-auto rounded-xl" />
              <p className="text-xs text-muted mt-3 font-mono break-all px-2">{aluno.qrCodeToken.slice(0, 16)}...</p>
            </>
          ) : (
            <div className="w-48 h-48 mx-auto rounded-xl bg-dark-card flex items-center justify-center">
              <QrCode size={40} className="text-muted opacity-30" />
            </div>
          )}
          <button
            onClick={imprimir}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dark-border text-xs font-semibold hover:border-cyan/40 transition-colors"
          >
            <Printer size={13} /> Imprimir QR Code
          </button>
        </div>

        {/* Stats rápidos */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          {[
            {
              label: 'Acessos este mês',
              value: aluno.acessos?.filter(a => dayjs(a.criadoEm).isAfter(dayjs().startOf('month'))).length ?? 0,
              icon: ShieldCheck, color: 'text-cyan',
            },
            {
              label: 'Total de acessos',
              value: aluno.acessos?.length ?? 0,
              icon: ShieldCheck, color: 'text-green',
            },
            {
              label: 'Pagamentos realizados',
              value: aluno.pagamentos?.filter(p => p.status === 'PAGO').length ?? 0,
              icon: CreditCard, color: 'text-cyan',
            },
            {
              label: 'Último acesso',
              value: aluno.acessos?.[0]
                ? dayjs(aluno.acessos[0].criadoEm).fromNow()
                : 'Nunca',
              icon: Clock, color: 'text-muted',
              small: true,
            },
          ].map(s => (
            <div key={s.label} className="card p-4">
              <s.icon size={16} className={s.color + ' mb-2'} />
              <div className={`${s.small ? 'text-lg' : 'text-2xl'} font-bold font-display ${s.color}`}>
                {s.value}
              </div>
              <div className="text-xs text-muted mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Abas ──────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'visao-geral', label: 'Visão Geral' },
          { key: 'frequencia', label: '📅 Frequência' },
          { key: 'acessos', label: `Acessos (${aluno.acessos?.length ?? 0})` },
          { key: 'pagamentos', label: `Pagamentos (${aluno.pagamentos?.length ?? 0})` },
        ].map(aba => (
          <button
            key={aba.key}
            onClick={() => setAbaTela(aba.key as any)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${abaTela === aba.key ? 'bg-cyan/10 text-cyan border border-cyan/30' : 'text-muted hover:text-white'}`}
          >
            {aba.label}
          </button>
        ))}
      </div>

      {/* ── Aba: Frequência ─────────────────────────────────── */}
      {abaTela === 'frequencia' && (() => {
        const acessosLiberados = aluno.acessos?.filter((a: any) => a.resultado === 'LIBERADO') ?? []

        // Mapa dia → lista de horários
        const porDia: Record<string, string[]> = {}
        acessosLiberados.forEach((a: any) => {
          const dia = dayjs(a.criadoEm).format('YYYY-MM-DD')
          if (!porDia[dia]) porDia[dia] = []
          porDia[dia].push(dayjs(a.criadoEm).format('HH:mm'))
        })

        // Heatmap: últimos 84 dias (12 semanas)
        const hoje = dayjs()
        const diasHeatmap = Array.from({ length: 84 }, (_, i) =>
          hoje.subtract(83 - i, 'day').format('YYYY-MM-DD')
        )

        // Frequência por dia da semana
        const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
        const porDiaSemana = Array(7).fill(0)
        acessosLiberados.forEach((a: any) => { porDiaSemana[dayjs(a.criadoEm).day()]++ })
        const maxDiaSemana = Math.max(...porDiaSemana, 1)

        // Frequência por hora
        const porHora = Array(24).fill(0)
        acessosLiberados.forEach((a: any) => { porHora[dayjs(a.criadoEm).hour()]++ })
        const maxHora = Math.max(...porHora, 1)
        const horaFavorita = porHora.indexOf(Math.max(...porHora))

        // Sequência atual (streak)
        let streak = 0
        let d = hoje
        while (porDia[d.format('YYYY-MM-DD')]) {
          streak++
          d = d.subtract(1, 'day')
        }

        // Média de visitas por semana
        const semanas = Math.max(Math.ceil(acessosLiberados.length > 0
          ? hoje.diff(dayjs(acessosLiberados[acessosLiberados.length - 1]?.criadoEm), 'week') + 1
          : 1, 1), 1)
        const mediaVisitas = (acessosLiberados.length / semanas).toFixed(1)

        return (
          <div className="space-y-6">
            {/* Stats de frequência */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total de visitas', value: acessosLiberados.length, icon: ShieldCheck, color: 'text-cyan' },
                { label: 'Visitas por semana', value: mediaVisitas, icon: TrendingUp, color: 'text-green' },
                { label: 'Sequência atual', value: `${streak} dia${streak !== 1 ? 's' : ''}`, icon: Flame, color: streak > 3 ? 'text-orange' : 'text-muted' },
                { label: 'Horário favorito', value: acessosLiberados.length > 0 ? `${String(horaFavorita).padStart(2,'0')}h` : '—', icon: Clock, color: 'text-cyan' },
              ].map(s => (
                <div key={s.label} className="card p-4">
                  <s.icon size={16} className={s.color + ' mb-2'} />
                  <div className={`text-xl font-bold font-display ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-muted">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Heatmap de visitas — 12 semanas */}
            <div className="card p-5">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Calendar size={14} className="text-cyan" /> Calendário de Visitas (últimas 12 semanas)
              </h3>
              <div className="flex gap-1 flex-wrap">
                {diasHeatmap.map(dia => {
                  const visitas = porDia[dia]?.length ?? 0
                  const isHoje = dia === hoje.format('YYYY-MM-DD')
                  return (
                    <div
                      key={dia}
                      title={`${dayjs(dia).format('DD/MM/YYYY')}${visitas > 0 ? ` · ${visitas} visita${visitas > 1 ? 's' : ''} · ${porDia[dia].join(', ')}` : ' · sem visita'}`}
                      className={`w-3.5 h-3.5 rounded-sm cursor-default transition-transform hover:scale-125 ${
                        isHoje ? 'ring-1 ring-cyan' :
                        visitas === 0 ? 'bg-dark-border' :
                        visitas === 1 ? 'bg-cyan/30' :
                        visitas === 2 ? 'bg-cyan/60' :
                        'bg-cyan'
                      }`}
                    />
                  )
                })}
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-muted">
                <span>Menos</span>
                {['bg-dark-border', 'bg-cyan/30', 'bg-cyan/60', 'bg-cyan'].map(c => (
                  <div key={c} className={`w-3.5 h-3.5 rounded-sm ${c}`} />
                ))}
                <span>Mais</span>
              </div>
            </div>

            {/* Gráfico por dia da semana */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-5">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <BarChart2 size={14} className="text-cyan" /> Visitas por Dia da Semana
                </h3>
                <div className="flex items-end gap-2 h-24">
                  {DIAS.map((dia, i) => {
                    const pct = (porDiaSemana[i] / maxDiaSemana) * 100
                    const isMax = porDiaSemana[i] === Math.max(...porDiaSemana)
                    return (
                      <div key={dia} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={`w-full rounded-t-sm ${isMax ? 'bg-cyan' : 'bg-cyan/30'}`}
                          style={{ height: `${Math.max(pct, 5)}%` }}
                        />
                        <span className="text-xs text-muted">{dia}</span>
                        <span className="text-xs font-bold">{porDiaSemana[i]}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Gráfico por hora do dia */}
              <div className="card p-5">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <Clock size={14} className="text-cyan" /> Horários de Entrada
                </h3>
                <div className="flex items-end gap-0.5 h-24">
                  {porHora.map((qtd, hora) => {
                    const pct = (qtd / maxHora) * 100
                    const isMax = qtd === Math.max(...porHora) && qtd > 0
                    return (
                      <div
                        key={hora}
                        className="flex-1 flex flex-col items-center group relative"
                        title={`${String(hora).padStart(2,'0')}h: ${qtd} visita${qtd !== 1 ? 's' : ''}`}
                      >
                        <div
                          className={`w-full rounded-t-sm transition-colors ${isMax ? 'bg-cyan' : qtd > 0 ? 'bg-cyan/40 group-hover:bg-cyan/70' : 'bg-dark-border'}`}
                          style={{ height: `${Math.max(pct, 3)}%` }}
                        />
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between text-xs text-muted mt-1">
                  <span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>23h</span>
                </div>
              </div>
            </div>

            {/* Lista de visitas recentes com horário */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-dark-border flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Clock size={14} className="text-cyan" /> Registro de Visitas com Horário
                </h3>
                <span className="text-xs text-muted">{acessosLiberados.length} visitas registradas</span>
              </div>
              {acessosLiberados.length === 0 ? (
                <div className="text-center py-10 text-muted text-sm">
                  <ShieldCheck size={32} className="mx-auto mb-3 opacity-20" />
                  Nenhuma visita registrada ainda
                </div>
              ) : (
                <div className="divide-y divide-dark-border/50 max-h-[400px] overflow-auto">
                  {/* Agrupar por data */}
                  {Object.entries(
                    acessosLiberados.reduce((acc: Record<string, any[]>, a: any) => {
                      const d = dayjs(a.criadoEm).format('YYYY-MM-DD')
                      if (!acc[d]) acc[d] = []
                      acc[d].push(a)
                      return acc
                    }, {})
                  ).sort(([a], [b]) => b.localeCompare(a)).map(([dia, visitas]) => (
                    <div key={dia}>
                      <div className="px-5 py-2 bg-dark-card/60 flex items-center justify-between">
                        <span className="text-xs font-bold text-muted uppercase tracking-wider">
                          {dayjs(dia).format('dddd, DD [de] MMMM')}
                        </span>
                        <span className="text-xs text-cyan font-semibold">
                          {(visitas as any[]).length} visita{(visitas as any[]).length > 1 ? 's' : ''}
                        </span>
                      </div>
                      {(visitas as any[]).map((a: any) => (
                        <div key={a.id} className="flex items-center gap-3 px-5 py-2.5">
                          <div className="w-10 h-10 rounded-xl bg-cyan/10 flex flex-col items-center justify-center flex-shrink-0">
                            <span className="text-cyan text-xs font-bold leading-none">{dayjs(a.criadoEm).format('HH')}</span>
                            <span className="text-cyan/60 text-xs leading-none">{dayjs(a.criadoEm).format('mm')}</span>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{dayjs(a.criadoEm).format('HH:mm:ss')}</div>
                            <div className="text-xs text-muted">
                              {a.tipo === 'QR_CODE' ? '📱 QR Code' : a.tipo === 'BIOMETRIA' ? '👤 Facial' : a.tipo === 'MANUAL' ? '🔓 Manual' : a.tipo}
                              {a.catraca?.nome ? ` · ${a.catraca.nome}` : ''}
                            </div>
                          </div>
                          <span className="text-xs text-muted">{dayjs(a.criadoEm).fromNow()}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* ── Aba: Visão Geral ─────────────────────────────────── */}
      {abaTela === 'visao-geral' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Histórico de matrículas */}
          <div className="card p-5">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <UserCheck size={14} className="text-cyan" /> Histórico de Matrículas
            </h3>
            {aluno.matriculas?.length === 0 ? (
              <p className="text-muted text-sm">Sem matrículas registradas</p>
            ) : (
              <div className="space-y-3">
                {aluno.matriculas?.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-dark-border/50 last:border-0">
                    <div>
                      <div className="text-sm font-medium">{m.plano?.nome}</div>
                      <div className="text-xs text-muted">
                        {dayjs(m.dataInicio).format('DD/MM/YY')} → {dayjs(m.dataVencimento).format('DD/MM/YY')}
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${m.status === 'ATIVA' ? 'bg-green/10 text-green' : 'bg-dark-border text-muted'}`}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Últimos acessos */}
          <div className="card p-5">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <ShieldCheck size={14} className="text-cyan" /> Últimos Acessos
            </h3>
            {aluno.acessos?.length === 0 ? (
              <p className="text-muted text-sm">Nenhum acesso registrado</p>
            ) : (
              <div className="space-y-2">
                {aluno.acessos?.slice(0, 8).map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-dark-border/40 last:border-0">
                    <div className="flex items-center gap-2">
                      {a.resultado === 'LIBERADO'
                        ? <ShieldCheck size={13} className="text-green" />
                        : <ShieldX size={13} className="text-red" />}
                      <span className="text-xs">{a.tipo} {a.motivoBloqueio ? `· ${a.motivoBloqueio}` : ''}</span>
                    </div>
                    <span className="text-xs text-muted">{dayjs(a.criadoEm).format('DD/MM HH:mm')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Aba: Acessos completos ───────────────────────────── */}
      {abaTela === 'acessos' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-dark-border">
            <h3 className="font-semibold text-sm">Histórico completo de acessos</h3>
          </div>
          <div className="divide-y divide-dark-border/50 max-h-[500px] overflow-auto">
            {aluno.acessos?.length === 0 ? (
              <p className="text-muted text-sm p-5">Nenhum acesso registrado</p>
            ) : aluno.acessos?.map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${a.resultado === 'LIBERADO' ? 'bg-green/20 text-green' : 'bg-red/20 text-red'}`}>
                  {a.resultado === 'LIBERADO' ? <ShieldCheck size={14} /> : <ShieldX size={14} />}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{a.resultado === 'LIBERADO' ? 'Acesso Liberado' : 'Acesso Negado'}</div>
                  <div className="text-xs text-muted">{a.tipo}{a.motivoBloqueio ? ` · ${a.motivoBloqueio}` : ''}{a.catraca ? ` · ${a.catraca.nome}` : ''}</div>
                </div>
                <span className="text-xs text-muted flex-shrink-0">{dayjs(a.criadoEm).format('DD/MM/YYYY HH:mm:ss')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Aba: Pagamentos ───────────────────────────────────── */}
      {abaTela === 'pagamentos' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-dark-border">
            <h3 className="font-semibold text-sm">Histórico de pagamentos</h3>
          </div>
          <div className="divide-y divide-dark-border/50 max-h-[500px] overflow-auto">
            {aluno.pagamentos?.length === 0 ? (
              <p className="text-muted text-sm p-5">Nenhum pagamento registrado</p>
            ) : aluno.pagamentos?.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${p.status === 'PAGO' ? 'bg-green/20 text-green' : p.status === 'PENDENTE' ? 'bg-orange/20 text-orange' : 'bg-red/20 text-red'}`}>
                  <CreditCard size={14} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">R$ {Number(p.valor).toFixed(2)}</div>
                  <div className="text-xs text-muted">{p.metodo} · {p.descricao ?? 'Mensalidade'}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.status === 'PAGO' ? 'bg-green/10 text-green' : p.status === 'PENDENTE' ? 'bg-orange/10 text-orange' : 'bg-red/10 text-red'}`}>
                    {p.status}
                  </span>
                  <div className="text-xs text-muted mt-0.5">{dayjs(p.dataVencimento).format('DD/MM/YYYY')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal biometria */}
      {faceModal && (
        <CadastrarFaceModal
          aluno={aluno}
          onClose={() => setFaceModal(false)}
          onSucesso={() => { setFaceModal(false); carregar() }}
        />
      )}
    </div>
  )
}
