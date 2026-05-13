import { useEffect, useState } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from "react-native"
import { useRouter } from "expo-router"
import { useAuthStore } from "../../stores/auth.store"
import { api } from "../../lib/api"
import dayjs from "dayjs"
import "dayjs/locale/pt-br"
dayjs.locale("pt-br")

export default function HomeScreen() {
  const { aluno, carregarPerfil } = useAuthStore()
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  const matricula = aluno?.matriculas?.[0]
  const diasRestantes = matricula
    ? Math.max(0, dayjs(matricula.dataVencimento).diff(dayjs(), "day"))
    : 0
  const progresso = matricula
    ? Math.min(1, (dayjs().diff(dayjs(matricula.dataInicio), "day") / (matricula.plano?.duracaoDias ?? 30)))
    : 0

  const onRefresh = async () => {
    setRefreshing(true)
    await carregarPerfil()
    setRefreshing(false)
  }

  const statusColor = aluno?.status === "ATIVO" ? "#00FF87" : "#FF4466"
  const statusLabel = aluno?.status === "ATIVO" ? "ATIVO" : aluno?.status ?? "–"

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00E5FF" />}>
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Bom dia,</Text>
          <Text style={s.userName}>{aluno?.nome?.split(" ")[0] ?? "Atleta"} 💪</Text>
        </View>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{aluno?.nome?.charAt(0) ?? "A"}</Text>
        </View>
      </View>

      {/* Status Card */}
      <View style={s.statusCard}>
        <View style={s.statusTop}>
          <Text style={s.statusLabel}>SEU PLANO</Text>
          <View style={[s.statusBadge, { borderColor: statusColor }]}>
            <Text style={[s.statusBadgeText, { color: statusColor }]}>● {statusLabel}</Text>
          </View>
        </View>
        <Text style={s.planName}>{matricula?.plano?.nome ?? "Sem plano ativo"}</Text>
        <Text style={s.planDate}>
          {matricula ? `Vence em ${diasRestantes} dia${diasRestantes !== 1 ? "s" : ""} — ${dayjs(matricula.dataVencimento).format("DD/MM/YYYY")}` : "Sem matrícula ativa"}
        </Text>
        <View style={s.progressWrap}>
          <View style={s.progressLabels}>
            <Text style={s.progressLabel}>Progresso do mês</Text>
            <Text style={s.progressLabel}>{Math.round(progresso * 100)}%</Text>
          </View>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${Math.round(progresso * 100)}%` }]} />
          </View>
        </View>
      </View>

      {/* Mini Cards */}
      <View style={s.miniCards}>
        <View style={s.miniCard}>
          <Text style={s.miniLabel}>CHECK-INS</Text>
          <Text style={[s.miniValue, { color: "#00E5FF" }]}>{aluno?.acessos?.length ?? 0}</Text>
          <Text style={s.miniSub}>este mês</Text>
        </View>
        <View style={s.miniCard}>
          <Text style={s.miniLabel}>VENCIMENTO</Text>
          <Text style={[s.miniValue, { color: diasRestantes <= 5 ? "#FF6B00" : "#fff" }]}>{diasRestantes}d</Text>
          <Text style={s.miniSub}>restantes</Text>
        </View>
      </View>

      {/* QR Code CTA */}
      <Text style={s.sectionTitle}>Acesso Rápido</Text>
      <TouchableOpacity style={s.qrCard} onPress={() => router.push("/(tabs)/qrcode")}>
        <View style={s.qrIcon}><Text style={s.qrIconText}>▦</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.qrTitle}>Gerar QR Code de Entrada</Text>
          <Text style={s.qrSub}>Apresente na catraca para entrar</Text>
        </View>
        <Text style={s.qrArrow}>→</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08080F" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  greeting: { fontSize: 12, color: "#8888AA" },
  userName: { fontSize: 20, fontWeight: "800", color: "#fff" },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#00E5FF", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontWeight: "800", color: "#08080F" },
  statusCard: { margin: 20, marginTop: 4, backgroundColor: "#111119", borderRadius: 20, borderWidth: 1, borderColor: "rgba(0,229,255,0.3)", padding: 18 },
  statusTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  statusLabel: { fontSize: 10, fontWeight: "700", color: "#8888AA", textTransform: "uppercase", letterSpacing: 2 },
  statusBadge: { borderRadius: 100, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 2 },
  statusBadgeText: { fontSize: 10, fontWeight: "700" },
  planName: { fontSize: 20, fontWeight: "800", color: "#00E5FF" },
  planDate: { fontSize: 12, color: "#8888AA", marginTop: 2 },
  progressWrap: { marginTop: 12 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  progressLabel: { fontSize: 10, color: "#8888AA" },
  progressBar: { height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 4 },
  progressFill: { height: 4, backgroundColor: "#00E5FF", borderRadius: 4 },
  miniCards: { flexDirection: "row", gap: 12, paddingHorizontal: 20, marginBottom: 20 },
  miniCard: { flex: 1, backgroundColor: "#1A1A26", borderRadius: 16, borderWidth: 1, borderColor: "#2A2A3A", padding: 14 },
  miniLabel: { fontSize: 9, fontWeight: "700", color: "#8888AA", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 },
  miniValue: { fontSize: 24, fontWeight: "800", color: "#fff" },
  miniSub: { fontSize: 10, color: "#8888AA", marginTop: 2 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#fff", paddingHorizontal: 20, marginBottom: 10 },
  qrCard: { marginHorizontal: 20, backgroundColor: "#1A1A26", borderRadius: 16, borderWidth: 1, borderColor: "#2A2A3A", padding: 16, flexDirection: "row", alignItems: "center", gap: 14 },
  qrIcon: { width: 48, height: 48, backgroundColor: "#00E5FF", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  qrIconText: { fontSize: 24, color: "#08080F" },
  qrTitle: { fontSize: 14, fontWeight: "700", color: "#fff" },
  qrSub: { fontSize: 12, color: "#8888AA", marginTop: 2 },
  qrArrow: { fontSize: 18, color: "#8888AA" },
})
