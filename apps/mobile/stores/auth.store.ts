import { create } from "zustand"
import * as SecureStore from "expo-secure-store"
import { createClient } from "@supabase/supabase-js"
import { api } from "../lib/api"

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
)

interface AuthState {
  aluno: any | null
  token: string | null
  loading: boolean
  login: (email: string, senha: string) => Promise<void>
  logout: () => Promise<void>
  carregarPerfil: () => Promise<void>
  inicializar: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  aluno: null,
  token: null,
  loading: true,

  inicializar: async () => {
    const token = await SecureStore.getItemAsync("gymflow_token")
    if (token) {
      set({ token })
      await get().carregarPerfil()
    }
    set({ loading: false })
  },

  login: async (email, senha) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) throw new Error(error.message)
    const token = data.session!.access_token
    await SecureStore.setItemAsync("gymflow_token", token)
    set({ token })
    await get().carregarPerfil()
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("gymflow_token")
    await supabase.auth.signOut()
    set({ aluno: null, token: null })
  },

  carregarPerfil: async () => {
    try {
      const { data } = await api.get("/alunos/meu-perfil")
      set({ aluno: data })
    } catch {
      set({ aluno: null })
    }
  },
}))
