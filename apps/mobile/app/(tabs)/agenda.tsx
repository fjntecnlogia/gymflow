import { View, Text, ScrollView, StyleSheet } from "react-native"

const AULAS = [
  { hora: "06:00", nome: "Musculação Livre", professor: "Prof. Carvalho", vagas: "∞" },
  { hora: "07:00", nome: "Spinning", professor: "Prof. Ana", vagas: "15" },
  { hora: "09:00", nome: "Funcional", professor: "Prof. Ricardo", vagas: "20" },
  { hora: "17:00", nome: "Pilates", professor: "Prof. Juliana", vagas: "12" },
  { hora: "18:30", nome: "Musculação Livre", professor: "Prof. Carvalho", vagas: "∞" },
  { hora: "19:00", nome: "Spinning Avançado", professor: "Prof. Ana", vagas: "15" },
]

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
const hoje = new Date().getDay()

export default function AgendaScreen() {
  return (
    <ScrollView style={s.container}>
      <Text style={s.pageTitle}>Agenda 📅</Text>

      {/* Dias da semana */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.diasScroll} contentContainerStyle={s.diasContent}>
        {DIAS.map((d, i) => {
          const ativo = i === (hoje === 0 ? 6 : hoje - 1)
          return (
            <View key={d} style={[s.diaBtn, ativo && s.diaBtnAtivo]}>
              <Text style={[s.diaTxt, ativo && s.diaTxtAtivo]}>{d}</Text>
            </View>
          )
        })}
      </ScrollView>

      {/* Aulas */}
      <Text style={s.sectionTitle}>Aulas de Hoje</Text>
      <View style={s.aulasWrap}>
        {AULAS.map((a, i) => (
          <View key={i} style={s.aulaCard}>
            <View style={s.aulaHora}>
              <Text style={s.aulaHoraTxt}>{a.hora}</Text>
            </View>
            <View style={s.aulaInfo}>
              <Text style={s.aulaNome}>{a.nome}</Text>
              <Text style={s.aulaProf}>{a.professor}</Text>
            </View>
            <View style={s.aulaVagas}>
              <Text style={s.aulaVagasTxt}>{a.vagas}</Text>
              <Text style={s.aulaVagasLabel}>vagas</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08080F" },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#fff", padding: 20, paddingTop: 60 },
  diasScroll: { marginBottom: 20 },
  diasContent: { paddingHorizontal: 20, gap: 8 },
  diaBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, backgroundColor: "#1A1A26", borderWidth: 1, borderColor: "#2A2A3A" },
  diaBtnAtivo: { backgroundColor: "#00E5FF", borderColor: "#00E5FF" },
  diaTxt: { fontSize: 13, fontWeight: "600", color: "#8888AA" },
  diaTxtAtivo: { color: "#08080F" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#fff", paddingHorizontal: 20, marginBottom: 10 },
  aulasWrap: { paddingHorizontal: 20, gap: 10, paddingBottom: 32 },
  aulaCard: { backgroundColor: "#111119", borderRadius: 16, borderWidth: 1, borderColor: "#2A2A3A", padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  aulaHora: { backgroundColor: "#1A1A26", borderRadius: 10, padding: 10, minWidth: 52, alignItems: "center" },
  aulaHoraTxt: { fontSize: 13, fontWeight: "700", color: "#00E5FF" },
  aulaInfo: { flex: 1 },
  aulaNome: { fontSize: 14, fontWeight: "700", color: "#fff" },
  aulaProf: { fontSize: 12, color: "#8888AA", marginTop: 2 },
  aulaVagas: { alignItems: "center" },
  aulaVagasTxt: { fontSize: 16, fontWeight: "800", color: "#fff" },
  aulaVagasLabel: { fontSize: 9, color: "#8888AA" },
})
