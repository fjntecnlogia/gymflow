import { useEffect, useState } from "react"
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from "react-native"
import { useAuthStore } from "../../stores/auth.store"
import { api } from "../../lib/api"
import dayjs from "dayjs"
import "dayjs/locale/pt-br"
dayjs.locale("pt-br")

export default function PlanoScreen() {
  const { aluno } = useAuthStore()
  const [pagamentos, setPagamentos] = useState<any[]>([])

  const matricula = aluno?.matriculas?.[0]
  const diasRestantes = matricula ? Math.max(0, dayjs(matricula.dataVencimento).diff(dayjs(), "day")) : 0

  useEffect(() => {
    api.get("/pagamentos?limit=6").then((r) => setPagamentos(r.data)).catch(() => {})
  }, [])

  return (
    <ScrollView style={s.container}>
      <Text style={s.pageTitle}>Meu Plano 💳</Text>

      {/* Card do plano */}
      <View style={s.planCard}>
        <Text style={s.planCardLabel}>PLANO ATIVO</Text>
        <Text style={s.planCardName}>{matricula?.plano?.nome ?? "Sem plano"}</Text>
        <Text style={s.planCardPrice}>
          R$ {matricula ? Number(matricula.valorPago).toFixed(2) : "–"} / {matricula?.plano?.tipo?.toLowerCase() ?? "mês"}
        </Text>
      </View>

      {/* Detalhes */}
      <View style={s.detailsWrap}>
        <View style={s.detailRow}>
          <View style={s.detailCard}>
            <Text style={s.detailLabel}>PRÓXIMO VENCIMENTO</Text>
            <Text style={s.detailValue}>{matricula ? dayjs(matricula.dataVencimento).format("DD/MM/YYYY") : "–"}</Text>
          </View>
          <View style={[s.detailCard, diasRestantes <= 5 && { borderColor: "#FF6B00" }]}>
            <Text style={s.detailLabel}>DIAS RESTANTES</Text>
            <Text style={[s.detailValue, { color: diasRestantes <= 5 ? "#FF6B00" : "#fff" }]}>{diasRestantes}d</Text>
          </View>
        </View>
      </View>

      {/* Renovar */}
      {diasRestantes <= 7 && (
        <TouchableOpacity style={s.renewBtn}>
          <Text style={s.renewText}>🔄  Renovar Plano Agora</Text>
        </TouchableOpacity>
      )}

      {/* Histórico */}
      <Text style={s.sectionTitle}>Histórico de Pagamentos</Text>
      <View style={s.historyWrap}>
        {pagamentos.length === 0 ? (
          <Text style={s.emptyText}>Nenhum pagamento registrado</Text>
        ) : pagamentos.map((p) => (
          <View key={p.id} style={s.histRow}>
            <View>
              <Text style={s.histMonth}>{dayjs(p.criadoEm).format("MMMM [de] YYYY")}</Text>
              <Text style={s.histDate}>{p.dataPagamento ? `Pago em ${dayjs(p.dataPagamento).format("DD/MM")}` : "Pendente"}</Text>
            </View>
            <Text style={[s.histValue, { color: p.status === "PAGO" ? "#00FF87" : "#FF6B00" }]}>
              R$ {Number(p.valor).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08080F" },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#fff", padding: 20, paddingTop: 60 },
  planCard: { marginHorizontal: 20, borderRadius: 20, padding: 20, backgroundColor: "#00C4E0", marginBottom: 16 },
  planCardLabel: { fontSize: 10, fontWeight: "700", color: "rgba(8,8,15,0.6)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 },
  planCardName: { fontSize: 22, fontWeight: "900", color: "#08080F", letterSpacing: -0.5 },
  planCardPrice: { fontSize: 14, color: "rgba(8,8,15,0.7)", marginTop: 4 },
  detailsWrap: { paddingHorizontal: 20, marginBottom: 16 },
  detailRow: { flexDirection: "row", gap: 12 },
  detailCard: { flex: 1, backgroundColor: "#1A1A26", borderRadius: 16, borderWidth: 1, borderColor: "#2A2A3A", padding: 14 },
  detailLabel: { fontSize: 9, fontWeight: "700", color: "#8888AA", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 },
  detailValue: { fontSize: 18, fontWeight: "800", color: "#fff" },
  renewBtn: { marginHorizontal: 20, backgroundColor: "rgba(0,229,255,0.1)", borderWidth: 1, borderColor: "rgba(0,229,255,0.4)", borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 20 },
  renewText: { color: "#00E5FF", fontWeight: "700", fontSize: 14 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#fff", paddingHorizontal: 20, marginBottom: 10 },
  historyWrap: { marginHorizontal: 20, backgroundColor: "#111119", borderRadius: 16, borderWidth: 1, borderColor: "#2A2A3A", overflow: "hidden", marginBottom: 32 },
  histRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderBottomWidth: 1, borderBottomColor: "#2A2A3A" },
  histMonth: { fontSize: 13, fontWeight: "600", color: "#fff", textTransform: "capitalize" },
  histDate: { fontSize: 11, color: "#8888AA", marginTop: 2 },
  histValue: { fontSize: 14, fontWeight: "700" },
  emptyText: { padding: 20, color: "#8888AA", textAlign: "center", fontSize: 13 },
})
