import { useEffect, useState } from "react"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { View, Text, ActivityIndicator, StyleSheet } from "react-native"
import { useAuthStore } from "../stores/auth.store"
import { healthCheck } from "../lib/health"
import SemConexaoScreen from "./sem-conexao"

type HealthState = "checking" | "ok" | "down"

export default function RootLayout() {
  const { inicializar, loading, token } = useAuthStore()
  const [health, setHealth] = useState<HealthState>("checking")

  // 1. Health-check do backend ANTES de tentar inicializar a sessão.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const ok = await healthCheck()
      if (cancelled) return
      setHealth(ok ? "ok" : "down")
    })()
    return () => { cancelled = true }
  }, [])

  // 2. Só inicializa o auth depois que o backend confirmou estar de pé.
  useEffect(() => {
    if (health === "ok") inicializar()
  }, [health])

  if (health === "checking") {
    return (
      <View style={s.splash}>
        <View style={s.logoBox}><Text style={s.logoLetter}>G</Text></View>
        <ActivityIndicator color="#00E5FF" style={{ marginTop: 24 }} />
      </View>
    )
  }

  if (health === "down") {
    return <SemConexaoScreen onRetrySuccess={() => setHealth("ok")} />
  }

  if (loading) return null

  return (
    <>
      <StatusBar style="light" backgroundColor="#08080F" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#08080F" } }}>
        <Stack.Screen name="(auth)" redirect={!!token} />
        <Stack.Screen name="(tabs)" redirect={!token} />
        <Stack.Screen name="aluno" options={{ headerShown: false }} />
        <Stack.Screen name="sem-conexao" options={{ headerShown: false }} />
      </Stack>
    </>
  )
}

const s = StyleSheet.create({
  splash: {
    flex: 1, backgroundColor: "#08080F",
    alignItems: "center", justifyContent: "center",
  },
  logoBox: {
    width: 64, height: 64, borderRadius: 16, backgroundColor: "#00E5FF",
    alignItems: "center", justifyContent: "center",
  },
  logoLetter: { fontSize: 32, fontWeight: "900", color: "#08080F" },
})
