import { useState } from "react"
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from "react-native"
import { useRouter } from "expo-router"
import { useAuthStore } from "../../stores/auth.store"
import { mensagemDoErro } from "../../lib/errors"

export default function LoginScreen() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !senha) return Alert.alert("Atenção", "Preencha todos os campos")
    setLoading(true)
    try {
      await login(email.trim(), senha)
      router.replace("/(tabs)")
    } catch (err) {
      Alert.alert("Erro", mensagemDoErro(err, "Não foi possível fazer login"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.inner}>
        <View style={s.logoWrap}>
          <View style={s.logoBox}>
            <Text style={s.logoLetter}>G</Text>
          </View>
          <Text style={s.logoText}>
            <Text style={s.logoCyan}>Gym</Text>
            <Text style={s.logoStrong}>Flow</Text>
            <Text style={s.logoMuted}> Gestor</Text>
          </Text>
          <Text style={s.logoSub}>Sua academia. Sob controle.</Text>
        </View>

        <View style={s.form}>
          <Text style={s.label}>E-mail</Text>
          <TextInput
            style={s.input}
            placeholder="seu@email.com"
            placeholderTextColor="#8888AA"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={[s.label, { marginTop: 12 }]}>Senha</Text>
          <TextInput
            style={s.input}
            placeholder="••••••••"
            placeholderTextColor="#8888AA"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
          />

          <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#08080F" />
              : <Text style={s.btnText}>Entrar</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/(auth)/esqueci-senha")} style={s.forgotWrap}>
            <Text style={s.forgotText}>Esqueci minha senha</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.helpFooter}>
          Ainda não tem acesso?{"\n"}
          <Text style={s.helpFooterStrong}>Procure a recepção da sua academia.</Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#08080F" },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  logoWrap: { alignItems: "center", marginBottom: 40 },
  logoBox: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: "#00E5FF", alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  logoLetter: { fontSize: 28, fontWeight: "900", color: "#08080F" },
  logoText: { fontSize: 24, fontWeight: "800", color: "#fff", letterSpacing: -1 },
  logoCyan: { color: "#00E5FF" },
  logoStrong: { color: "#fff", fontWeight: "800" },
  logoMuted: { color: "#8888AA", fontWeight: "500" },
  logoSub: { fontSize: 12, color: "#8888AA", marginTop: 4 },
  form: {
    backgroundColor: "#111119", borderRadius: 20,
    borderWidth: 1, borderColor: "#2A2A3A", padding: 24,
  },
  label: { fontSize: 11, fontWeight: "700", color: "#8888AA", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 },
  input: {
    backgroundColor: "#1A1A26", borderRadius: 12, borderWidth: 1,
    borderColor: "#2A2A3A", color: "#fff", fontSize: 14, paddingHorizontal: 14, paddingVertical: 12,
  },
  btn: {
    backgroundColor: "#00E5FF", borderRadius: 12,
    paddingVertical: 14, alignItems: "center", marginTop: 20,
  },
  btnText: { fontSize: 15, fontWeight: "700", color: "#08080F" },
  forgotWrap: { marginTop: 16, paddingVertical: 8, alignItems: "center" },
  forgotText: { color: "#00E5FF", fontSize: 13, fontWeight: "600" },
  helpFooter: {
    textAlign: "center", color: "#8888AA", fontSize: 12,
    marginTop: 24, paddingHorizontal: 12, lineHeight: 18,
  },
  helpFooterStrong: { color: "#fff", fontWeight: "600" },
})
