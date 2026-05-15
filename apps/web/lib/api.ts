import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gfxjehsjwwtlrhcjvkfr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmeGplaHNqd3d0bHJoY2p2a2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MTkzNzgsImV4cCI6MjA5NDI5NTM3OH0.6CF-JQYynO84ZUfn2iHmhLc3U-g7xc2jAXuga38FftI'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'https://gymflow-production-abf9.up.railway.app',
  timeout: 15000,
})

// Injeta token em cada request — tenta Supabase, depois localStorage
api.interceptors.request.use(async (config) => {
  try {
    // Tenta sessão ativa do Supabase (renova automaticamente se expirado)
    const { data } = await supabase.auth.getSession()
    let token = data.session?.access_token

    // Se token expirou, tenta renovar
    if (!token) {
      const { data: refreshed } = await supabase.auth.refreshSession()
      token = refreshed.session?.access_token
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      return config
    }

    // Fallback: localStorage (usado em algumas telas)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('gymflow_token')
      if (stored) config.headers.Authorization = `Bearer ${stored}`
    }
  } catch {
    // Silencioso — 401 será tratado pelo response interceptor
  }
  return config
})

// Trata respostas de erro globalmente
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    // Erro de rede (sem resposta) — log para debug
    if (!err.response) {
      console.error('[API] Erro de rede:', err.message, 'URL:', err.config?.url)
    }

    // Token inválido → redireciona para login
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('gymflow_token')
      await supabase.auth.signOut()
      window.location.href = '/login'
    }

    return Promise.reject(err)
  },
)

// Helper para extrair mensagem de erro da API
export function getApiError(err: any): string {
  if (err?.response?.data?.error) return err.response.data.error
  if (err?.response?.data?.message) return err.response.data.message
  if (err?.response?.status === 401) return 'Sessão expirada. Faça login novamente.'
  if (err?.response?.status === 403) return 'Sem permissão para esta ação.'
  if (err?.response?.status === 404) return 'Recurso não encontrado.'
  if (err?.response?.status >= 500) return 'Erro interno do servidor. Tente novamente.'
  if (!err?.response) return `Erro de conexão com o servidor. Verifique sua internet.`
  return err?.message ?? 'Erro desconhecido'
}
