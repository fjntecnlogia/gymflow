'use client'
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { AlunoModal } from '@/components/alunos/AlunoModal'
import { MatricularModal } from '@/components/alunos/MatricularModal'
import { CadastrarFaceModal } from '@/components/alunos/CadastrarFaceModal'
import { Plus, Search, Users, Edit, UserCheck, Camera, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
dayjs.locale('pt-br')

const STATUS_TABS = [
  { label: 'Todos', value: '' },
  { label: 'Ativos', value: 'ATIVO' },
  { label: 'Inadimplentes', value: 'INADIMPLENTE' },
  { label: 'Suspensos', value: 'SUSPENSO' },
  { label: 'Cancelados', value: 'CANCELADO' },
]

export default function AlunosPage() {
  const router = useRouter()
  const [alunos, setAlunos] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [matricularOpen, setMatricularOpen] = useState(false)
  const [faceModalAluno, setFaceModalAluno] = useState<any | null>(null)
  const [alunoSelecionado, setAlunoSelecionado] = useState<any>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (busca) params.set('busca', busca)
      if (status) params.set('status', status)
      const { data } = await api.get(`/alunos?${params}`)
      setAlunos(data.alunos ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setAlunos([])
    } finally {
      setLoading(false)
    }
  }, [busca, status, page])

  useEffect(() => { carregar() }, [carregar])

  function abrirEditar(aluno: any) { setAlunoSelecionado(aluno); setModalOpen(true) }
  function abrirMatricular(aluno: any) { setAlunoSelecionado(aluno); setMatricularOpen(true) }
  function novoAluno() { setAlunoSelecionado(null); setModalOpen(true) }

  const statusColor: Record<string, string> = {
    ATIVO: 'text-green', INADIMPLENTE: 'text-red', SUSPENSO: 'text-orange', CANCELADO: 'text-muted'
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Alunos</h1>
          <p className="text-sm text-muted">{total} aluno{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}</p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={novoAluno}>Novo Aluno</Button>
      </div>

      {/* Busca */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            placeholder="Buscar por nome, email ou telefone..."
            value={busca}
            onChange={e => { setBusca(e.target.value); setPage(1) }}
            className="w-full bg-dark-card border border-dark-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-cyan outline-none transition-colors"
          />
        </div>
      </div>

      {/* Tabs de status */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setStatus(tab.value); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              status === tab.value
                ? 'bg-cyan/15 text-cyan border border-cyan/30'
                : 'bg-dark-card border border-dark-border text-muted hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-muted text-sm">Carregando...</div>
        ) : alunos.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={40} className="mx-auto mb-3 text-muted opacity-30" />
            <p className="text-muted text-sm">Nenhum aluno encontrado</p>
            <Button size="sm" className="mt-4" onClick={novoAluno}>Cadastrar primeiro aluno</Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                {['Nome', 'Telefone', 'Plano', 'Vencimento', 'Status', 'Bio', 'Ações'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alunos.map(a => {
                const mat = a.matriculas?.[0]
                return (
                  <tr key={a.id} className="border-b border-dark-border/40 hover:bg-white/2 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {a.fotoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.fotoUrl} alt={a.nome} className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-dark-border" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan to-blue flex items-center justify-center text-dark text-xs font-bold flex-shrink-0">
                            {a.nome.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold">{a.nome}</div>
                          {a.email && <div className="text-xs text-muted">{a.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted text-xs">{a.telefone}</td>
                    <td className="px-4 py-3 text-muted text-xs">{mat?.plano?.nome ?? <span className="text-orange">Sem plano</span>}</td>
                    <td className="px-4 py-3 text-xs">
                      {mat ? (
                        <span className={dayjs().isAfter(mat.dataVencimento) ? 'text-red font-semibold' : 'text-muted'}>
                          {dayjs(mat.dataVencimento).format('DD/MM/YYYY')}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${statusColor[a.status] ?? 'text-muted'}`}>
                        ● {a.status}
                      </span>
                    </td>
                    {/* Biometria */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setFaceModalAluno(a)}
                        title={a.faceId ? 'Face cadastrada — clique para atualizar' : 'Cadastrar biometria facial'}
                        className={`flex items-center gap-1 text-xs transition-colors ${
                          a.faceId ? 'text-green hover:text-green/80' : 'text-muted hover:text-cyan'
                        }`}
                      >
                        <Camera size={13} />
                        {a.faceId ? '✓' : '+'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => router.push(`/alunos/${a.id}`)}
                          className="flex items-center gap-1 text-xs text-cyan hover:text-cyan/80 transition-colors"
                        >
                          <Eye size={12} /> Ver Perfil
                        </button>
                        <button
                          onClick={() => abrirEditar(a)}
                          className="flex items-center gap-1 text-xs text-muted hover:text-white transition-colors"
                        >
                          <Edit size={12} /> Editar
                        </button>
                        <button
                          onClick={() => abrirMatricular(a)}
                          className="flex items-center gap-1 text-xs text-green hover:text-green/80 transition-colors"
                        >
                          <UserCheck size={12} /> Matricular
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Paginação */}
        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-border">
            <span className="text-xs text-muted">Mostrando {Math.min(page * 20, total)} de {total}</span>
            <div className="flex gap-2">
              <Button size="xs" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Anterior</Button>
              <Button size="xs" variant="outline" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Próximo →</Button>
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
      <AlunoModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={carregar} aluno={alunoSelecionado} />
      <MatricularModal open={matricularOpen} onClose={() => setMatricularOpen(false)} onSaved={carregar} aluno={alunoSelecionado} />
      {faceModalAluno && (
        <CadastrarFaceModal
          aluno={faceModalAluno}
          onClose={() => setFaceModalAluno(null)}
          onSucesso={() => { setFaceModalAluno(null); carregar() }}
        />
      )}
    </div>
  )
}
