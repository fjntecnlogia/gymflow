import axios, { AxiosError } from "axios"
import * as SecureStore from "expo-secure-store"
import { AppError, AppErrorCode } from "./errors"
import { track } from "./telemetry"

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.gymflowgestor.com.br"
const TOKEN_KEY = "gymflow_token"

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
})

// ─── Request: injeta Bearer token ───────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Hook pra o store de auth limpar estado quando token expira ─────────────
// O store registra um callback aqui no mount pra evitar import circular.
let onUnauthorized: (() => void) | null = null

export function setOnUnauthorized(handler: () => void) {
  onUnauthorized = handler
}

// ─── Response: traduz erros em AppError + telemetria ────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (raw: AxiosError<any>) => {
    const status = raw.response?.status
    const url = raw.config?.url ?? ""
    const isLoginRoute = /\/auth\/(aluno\/)?login$/.test(url)

    let code: AppErrorCode
    let message: string

    if (!raw.response) {
      // Sem resposta = sem rede / DNS / timeout
      code = "NETWORK"
      message = "Sem conexão com o sistema. Verifique sua internet."
    } else if (status === 401) {
      if (isLoginRoute) {
        code = "CREDS_INVALID"
        message = "E-mail ou senha incorretos."
      } else {
        code = "TOKEN_EXPIRED"
        message = "Sua sessão expirou. Entre novamente."
        await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {})
        onUnauthorized?.()
      }
    } else if (status === 403) {
      code = "FORBIDDEN"
      message = raw.response?.data?.error ?? "Acesso negado."
    } else if (status === 404) {
      code = "ENDPOINT_404"
      message = "Recurso não encontrado. O sistema pode estar em atualização."
    } else if (status === 429) {
      code = "RATE_LIMIT"
      message = "Muitas tentativas em pouco tempo. Aguarde alguns minutos."
    } else if (status && status >= 500) {
      code = "SERVER_ERROR"
      message = "O sistema está com instabilidade. Tente novamente em instantes."
    } else if (status && status >= 400) {
      const backendErr = raw.response?.data?.error
      // Backend Zod manda erro como string-JSON; pega só a primeira validação humana
      const friendly =
        typeof backendErr === "string" && !backendErr.startsWith("[")
          ? backendErr
          : "Dados inválidos."
      code = "VALIDATION"
      message = friendly
    } else {
      code = "UNKNOWN"
      message = "Erro desconhecido."
    }

    track("api_error", { code, status, url, method: raw.config?.method })

    return Promise.reject(new AppError(message, code, status, raw.response?.data))
  },
)
