import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gfxjehsjwwtlrhcjvkfr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmeGplaHNqd3d0bHJoY2p2a2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MTkzNzgsImV4cCI6MjA5NDI5NTM3OH0.6CF-JQYynO84ZUfn2iHmhLc3U-g7xc2jAXuga38FftI'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'https://gymflow-production-abf9.up.railway.app',
})

// Injeta token automaticamente em cada request
api.interceptors.request.use(async (config) => {
  try {
    // Tenta pegar sessão ativa do Supabase primeiro
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      return config
    }

    // Fallback: localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('gymflow_token')
      if (stored) config.headers.Authorization = `Bearer ${stored}`
    }
  } catch {
    // silencioso — token ausente é tratado na resposta
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('gymflow_token')
      await supabase.auth.signOut()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)
