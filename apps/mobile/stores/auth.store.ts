import { create } from "zustand"
import * as SecureStore from "expo-secure-store"
import { api, setOnUnauthorized } from "../lib/api"
import { track } from "../lib/telemetry"

// ─────────────────────────────────────────────────────────────────────────────
// Auth do app mobile (aluno).
// Backend: API GymFlow Gestor (Fastify + Postgres + bcrypt + JWT próprio).
// Endpoints (espelhando os de owner em /auth/*, namespaceados pra aluno):
//   POST /auth/aluno/login
//   POST /auth/aluno/primeiro-acesso
//   POST /auth/aluno/esqueci-senha
//   POST /auth/aluno/redefinir-senha
//
// Esses endpoints ainda podem não estar implementados no backend — o
// interceptor do axios traduz 404 em AppError code "ENDPOINT_404" e a tela
// mostra mensagem amigável ("Sistema em atualização").
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_KEY = "gymflow_token"

type LoginResponse = {
  token: string
  // Em login, backend pode devolver o aluno embutido. Senão, GET /alunos/meu-perfil.
  aluno?: any
}

interface AuthState {
  aluno: any | null
  token: string | null
  loading: boolean
  login: (email: string, senha: string) => Promise<void>
  logout: () => Promise<void>
  carregarPerfil: () => Promise<void>
  inicializar: () => Promise<void>

  primeiroAcesso: (token: string, senha: string) => Promise<void>
  solicitarRedefinicao: (email: string) => Promise<void>
  redefinirSenha: (token: string, novaSenha: string) => Promise<void>
}

async function persistirSessao(set: any, get: any, token: string, alunoRaw?: any) {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
  set({ token, aluno: alunoRaw ?? null })
  await get().carregarPerfil()
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Hook pra o interceptor 401 limpar o store sem precisar de import circular.
  setOnUnauthorized(() => {
    track("session_expired")
    set({ aluno: null, token: null })
  })

  return {
    aluno: null,
    token: null,
    loading: true,

    inicializar: async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY)
      if (token) {
        set({ token })
        await get().carregarPerfil()
      }
      set({ loading: false })
    },

    login: async (email, senha) => {
      const { data } = await api.post<LoginResponse>("/auth/aluno/login", {
        email: email.trim().toLowerCase(),
        senha,
      })

      if (!data?.token) {
        throw new Error("Resposta de login inválida do servidor.")
      }

      track("login_success")
      await persistirSessao(set, get, data.token, data.aluno)
    },

    logout: async () => {
      await SecureStore.deleteItemAsync(TOKEN_KEY)
      set({ aluno: null, token: null })
      track("logout")
    },

    carregarPerfil: async () => {
      try {
        const { data } = await api.get("/alunos/meu-perfil")
        set({ aluno: data })
      } catch {
        // Erro já foi traduzido pelo interceptor. Se foi 401, store já limpou.
        set({ aluno: null })
      }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Primeiro acesso: aluno recebeu e-mail com link contendo token único.
    // ─────────────────────────────────────────────────────────────────────────
    primeiroAcesso: async (token, senha) => {
      const { data } = await api.post<LoginResponse>("/auth/aluno/primeiro-acesso", {
        token,
        senha,
      })

      if (!data?.token) {
        throw new Error("Não foi possível criar sua senha.")
      }

      track("primeiro_acesso_success")
      await persistirSessao(set, get, data.token, data.aluno)
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Esqueci minha senha → backend gera token + envia link por e-mail.
    // ─────────────────────────────────────────────────────────────────────────
    solicitarRedefinicao: async (email) => {
      await api.post("/auth/aluno/esqueci-senha", {
        email: email.trim().toLowerCase(),
      })
      track("reset_requested")
    },

    // ─────────────────────────────────────────────────────────────────────────
    // Redefinir senha via link do e-mail "esqueci minha senha".
    // ─────────────────────────────────────────────────────────────────────────
    redefinirSenha: async (token, novaSenha) => {
      await api.post("/auth/aluno/redefinir-senha", {
        token,
        senha: novaSenha,
      })
      track("reset_success")
    },
  }
})
