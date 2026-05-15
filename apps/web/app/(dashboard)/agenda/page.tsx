'use client'
import { useState } from 'react'
import { Calendar, Plus, Clock, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
dayjs.locale('pt-br')

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const AULAS_EXEMPLO = [
  { id: '1', nome: 'Musculação', horario: '06:00', duracao: 60, professor: 'Carlos', vagas: 20, inscritos: 15, diasSemana: [1, 2, 3, 4, 5], cor: 'bg-cyan/20 border-cyan/40 text-cyan' },
  { id: '2', nome: 'Spinning', horario: '07:00', duracao: 45, professor: 'Ana', vagas: 15, inscritos: 15, diasSemana: [1, 3, 5], cor: 'bg-green/20 border-green/40 text-green' },
  { id: '3', nome: 'Yoga', horario: '08:00', duracao: 60, professor: 'Maria', vagas: 12, inscritos: 8, diasSemana: [2, 4, 6], cor: 'bg-purple/20 border-purple/40 text-purple' },
  { id: '4', nome: 'Funcional', horario: '09:00', duracao: 50, professor: 'João', vagas: 18, inscritos: 12, diasSemana: [1, 2, 3, 4, 5], cor: 'bg-orange/20 border-orange/40 text-orange' },
  { id: '5', nome: 'Zumba', horario: '18:00', duracao: 60, professor: 'Laura', vagas: 25, inscritos: 20, diasSemana: [2, 4, 6], cor: 'bg-pink/20 border-pink/40 text-pink' },
  { id: '6', nome: 'CrossFit', horario: '19:00', duracao: 60, professor: 'Pedro', vagas: 10, inscritos: 9, diasSemana: [1, 3, 5], cor: 'bg-red/20 border-red/40 text-red' },
]

export default function AgendaPage() {
  const [semanaBase, setSemanaBase] = useState(dayjs().startOf('week'))

  const dias = Array.from({ length: 7 }, (_, i) => semanaBase.add(i, 'day'))
  const hoje = dayjs()

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Agenda de Aulas</h1>
          <p className="text-muted text-sm mt-1">Grade semanal de aulas e atividades</p>
        </div>
        <button className="gradient-btn text-dark font-bold px-4 py-2 rounded-xl flex items-center gap-2 text-sm">
          <Plus size={16} /> Nova Aula
        </button>
      </div>

      {/* Navegação de semana */}
      <div className="flex items-center gap-4">
        <button onClick={() => setSemanaBase(s => s.subtract(1, 'week'))} className="p-2 rounded-lg border border-dark-border hover:border-cyan/40 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="font-semibold text-sm min-w-[200px] text-center">
          {semanaBase.format('DD MMM')} — {semanaBase.add(6, 'day').format('DD MMM YYYY')}
        </span>
        <button onClick={() => setSemanaBase(s => s.add(1, 'week'))} className="p-2 rounded-lg border border-dark-border hover:border-cyan/40 transition-colors">
          <ChevronRight size={16} />
        </button>
        <button onClick={() => setSemanaBase(dayjs().startOf('week'))} className="text-xs text-cyan hover:underline">
          Hoje
        </button>
      </div>

      {/* Grade semanal */}
      <div className="card overflow-hidden">
        {/* Cabeçalho dos dias */}
        <div className="grid grid-cols-8 border-b border-dark-border">
          <div className="px-3 py-3 text-xs font-bold text-muted uppercase tracking-wider">Aula</div>
          {dias.map((dia, i) => (
            <div key={i} className={`px-3 py-3 text-center ${dia.format('YYYY-MM-DD') === hoje.format('YYYY-MM-DD') ? 'bg-cyan/10' : ''}`}>
              <div className="text-xs text-muted">{DIAS_SEMANA[dia.day()]}</div>
              <div className={`text-lg font-bold font-display ${dia.format('YYYY-MM-DD') === hoje.format('YYYY-MM-DD') ? 'text-cyan' : ''}`}>
                {dia.format('DD')}
              </div>
            </div>
          ))}
        </div>

        {/* Linhas de aulas */}
        {AULAS_EXEMPLO.map(aula => (
          <div key={aula.id} className="grid grid-cols-8 border-b border-dark-border/50 hover:bg-white/2 transition-colors">
            <div className="px-3 py-3">
              <div className="font-semibold text-sm">{aula.nome}</div>
              <div className="flex items-center gap-1 text-xs text-muted mt-0.5">
                <Clock size={10} /> {aula.horario} · {aula.duracao}min
              </div>
              <div className="text-xs text-muted">{aula.professor}</div>
            </div>
            {dias.map((dia, i) => (
              <div key={i} className="px-2 py-3 flex items-center justify-center">
                {aula.diasSemana.includes(dia.day()) ? (
                  <div className={`w-full rounded-lg border px-2 py-1.5 text-center ${aula.cor} text-xs`}>
                    <div className="font-semibold">{aula.horario}</div>
                    <div className="flex items-center justify-center gap-0.5 mt-0.5 opacity-80">
                      <Users size={9} />
                      <span>{aula.inscritos}/{aula.vagas}</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-8" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <p className="text-xs text-muted text-center">
        💡 Módulo de agenda em desenvolvimento — em breve você poderá cadastrar aulas e gerenciar inscrições de alunos.
      </p>
    </div>
  )
}
