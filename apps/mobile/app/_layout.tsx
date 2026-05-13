import { useEffect } from "react"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useAuthStore } from "../stores/auth.store"

export default function RootLayout() {
  const { inicializar, loading, token } = useAuthStore()

  useEffect(() => { inicializar() }, [])

  if (loading) return null

  return (
    <>
      <StatusBar style="light" backgroundColor="#08080F" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#08080F" } }}>
        <Stack.Screen name="(auth)" redirect={!!token} />
        <Stack.Screen name="(tabs)" redirect={!token} />
      </Stack>
    </>
  )
}
