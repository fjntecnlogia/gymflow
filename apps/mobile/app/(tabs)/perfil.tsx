import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native"
import { useAuthStore } from "../../stores/auth.store"
import { useRouter } from "expo-router"
import dayjs from "dayjs"

export default function PerfilScreen() {
  const { aluno, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    Alert.alert("Sair", "Deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: async () => { await logout(); router.replace("/(auth)/login") } },
    ])
  }

  const campos = [
    { label: "Nome", value: aluno?.nome },
    { label: "E-mail", value: aluno?.email },
    { label: "Telefone", value: aluno?.telefone },
    { label: "CPF", value: aluno?.cpf ?? "Não informado" },
    { label: "Data de Nascimento", value: aluno?.dataNascimento ? dayjs(aluno.dataNascimento).format("DD/MM/YYYY") : "Não informado" },
  ]

  return (
    <ScrollView style={s.container}>
      <Text style={s.pageTitle}>Perfil</Text>

      {/* Avatar */}
      <View style={s.avatarSection}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{aluno?.nome?.charAt(0) ?? "A"}</Text>
        </View>
        <Text style={s.avatarName}>{aluno?.nome}</Text>
        <Text style={s.avatarEmail}>{aluno?.email}</Text>
        <View style={s.badge}>
          <Text style={s.badgeText}>● {aluno?.status ?? "–"}</Text>
        </View>
      </View>

      {/* Dados */}
      <Text style={s.sectionTitle}>Meus Dados</Text>
      <View style={s.infoCard}>
        {campos.map((c, i) => (
          <View key={c.label} style={[s.infoRow, i < campos.length - 1 && s.infoRowBorder]}>
            <Text style={s.infoLabel}>{c.label}</Text>
            <Text style={s.infoValue}>{c.value ?? "–"}</Text>
          </View>
        ))}
      </View>

      {/* Ações */}
      <View style={s.actionsCard}>
        <TouchableOpacity style={s.action}>
          <Text style={s.actionText}>📱 Alterar senha</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.action}>
          <Text style={s.actionText}>🔔 Notificações</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.action}>
          <Text style={s.actionText}>❓ Ajuda e suporte</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.action, s.actionLast]} onPress={handleLogout}>
          <Text style={[s.actionText, { color: "#FF4466" }]}>🚪 Sair da conta</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.version}>GYMFLOW v1.0.0</Text>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08080F" },
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#fff", padding: 20, paddingTop: 60 },
  avatarSection: { alignItems: "center", paddingBottom: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#00E5FF", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: "800", color: "#08080F" },
  avatarName: { fontSize: 20, fontWeight: "800", color: "#fff", marginBottom: 4 },
  avatarEmail: { fontSize: 13, color: "#8888AA" },
  badge: { marginTop: 8, backgroundColor: "rgba(0,255,135,0.1)", borderWidth: 1, borderColor: "rgba(0,255,135,0.3)", borderRadius: 100, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#00FF87" },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#8888AA", textTransform: "uppercase", letterSpacing: 2, paddingHorizontal: 20, marginBottom: 8 },
  infoCard: { marginHorizontal: 20, backgroundColor: "#111119", borderRadius: 16, borderWidth: 1, borderColor: "#2A2A3A", marginBottom: 16, overflow: "hidden" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", padding: 14 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: "#2A2A3A" },
  infoLabel: { fontSize: 13, color: "#8888AA" },
  infoValue: { fontSize: 13, fontWeight: "600", color: "#fff" },
  actionsCard: { marginHorizontal: 20, backgroundColor: "#111119", borderRadius: 16, borderWidth: 1, borderColor: "#2A2A3A", marginBottom: 24, overflow: "hidden" },
  action: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#2A2A3A" },
  actionLast: { borderBottomWidth: 0 },
  actionText: { fontSize: 14, color: "#fff" },
  version: { textAlign: "center", color: "#555570", fontSize: 11, marginBottom: 32 },
})
