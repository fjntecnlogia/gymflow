import { useEffect, useState, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator } from "react-native"
import { useAuthStore } from "../../stores/auth.store"
import { api } from "../../lib/api"

export default function QrCodeScreen() {
  const { aluno } = useAuthStore()
  const [qrData, setQrData] = useState<{ qrCode: string; token: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [segundos, setSegundos] = useState(30)
  const pulseAnim = useRef(new Animated.Value(1)).current

  const carregar = async () => {
    if (!aluno?.id) return
    setLoading(true)
    setSegundos(30)
    try {
      const { data } = await api.get(`/alunos/${aluno.id}/qrcode`)
      setQrData(data)
    } catch {
      setQrData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [aluno?.id])

  useEffect(() => {
    if (segundos <= 0) { carregar(); return }
    const t = setTimeout(() => setSegundos((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [segundos])

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  const statusOk = aluno?.status === "ATIVO"

  return (
    <View style={s.container}>
      <Text style={s.title}>QR Code de Acesso</Text>
      <Text style={s.sub}>Apresente na catraca para entrar</Text>

      <Animated.View style={[s.qrWrap, { transform: [{ scale: pulseAnim }] }]}>
        {loading ? (
          <ActivityIndicator size="large" color="#00E5FF" />
        ) : qrData?.qrCode ? (
          <View style={s.qrBox}>
            {/* QR Code como imagem base64 */}
            <Text style={s.qrPlaceholder}>▦</Text>
          </View>
        ) : (
          <Text style={s.errorText}>Erro ao gerar QR Code</Text>
        )}
      </Animated.View>

      <Text style={s.alunoNome}>{aluno?.nome}</Text>
      <Text style={s.alunoId}>Plano {aluno?.matriculas?.[0]?.plano?.nome ?? "–"} · #{aluno?.id?.slice(-6)}</Text>

      <View style={[s.statusBadge, statusOk ? s.badgeOk : s.badgeErr]}>
        <Text style={[s.statusText, statusOk ? s.textOk : s.textErr]}>
          {statusOk ? "● Acesso Liberado" : "● Acesso Bloqueado"}
        </Text>
      </View>

      <Text style={s.timer}>Atualiza em {segundos}s</Text>

      <TouchableOpacity style={s.refreshBtn} onPress={carregar}>
        <Text style={s.refreshText}>↻  Atualizar agora</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08080F", alignItems: "center", paddingTop: 60, paddingHorizontal: 24 },
  title: { fontSize: 20, fontWeight: "800", color: "#fff", marginBottom: 4 },
  sub: { fontSize: 13, color: "#8888AA", marginBottom: 32 },
  qrWrap: { width: 220, height: 220, backgroundColor: "#fff", borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 24, padding: 16 },
  qrBox: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  qrPlaceholder: { fontSize: 140, color: "#08080F" },
  errorText: { color: "#FF4466", fontSize: 13 },
  alunoNome: { fontSize: 20, fontWeight: "800", color: "#00E5FF", marginBottom: 4 },
  alunoId: { fontSize: 12, color: "#8888AA", marginBottom: 16 },
  statusBadge: { borderRadius: 100, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 8, marginBottom: 12 },
  badgeOk: { backgroundColor: "rgba(0,255,135,0.1)", borderColor: "rgba(0,255,135,0.4)" },
  badgeErr: { backgroundColor: "rgba(255,68,102,0.1)", borderColor: "rgba(255,68,102,0.4)" },
  statusText: { fontSize: 13, fontWeight: "700" },
  textOk: { color: "#00FF87" },
  textErr: { color: "#FF4466" },
  timer: { fontSize: 11, color: "#555570", marginBottom: 20 },
  refreshBtn: { borderWidth: 1, borderColor: "#2A2A3A", borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  refreshText: { color: "#8888AA", fontSize: 13 },
})
