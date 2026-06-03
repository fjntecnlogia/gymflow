import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'

// Lazy initialization — evita crash no startup quando vars não estão configuradas
let _supabase: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_KEY
    if (!url || !key || url === 'PREENCHER' || key === 'PREENCHER') {
      throw new Error('SUPABASE_URL e SUPABASE_SERVICE_KEY devem ser configurados')
    }
    _supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: WebSocket } as any,
    })
  }
  return _supabase
}

// Alias para compatibilidade
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get: (_target, prop) => {
    return (getSupabaseClient() as any)[prop]
  },
})

export async function verificarJWT(token: string) {
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) throw new Error('Token inválido')
  return data.user
}

export async function criarUsuarioAuth(email: string, senha: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  })
  if (error) throw new Error(error.message)
  return data.user
}

export async function deletarUsuarioAuth(supabaseId: string) {
  const { error } = await supabase.auth.admin.deleteUser(supabaseId)
  if (error) throw new Error(error.message)
}

/**
 * Convida um usuário por e-mail. Cria o user no Supabase Auth (sem senha)
 * e dispara automaticamente o e-mail de convite com magic link pra ele
 * setar a senha. Usado no signup pós-checkout público.
 *
 * @returns o user criado (com .id que vira o supabaseId da Usuario)
 */
export async function convidarUsuarioPorEmail(
  email: string,
  redirectTo?: string,
  metadata?: Record<string, any>,
) {
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: metadata,
  })
  if (error) throw new Error(`Supabase invite: ${error.message}`)
  if (!data.user) throw new Error('Supabase invite: user não retornado')
  return data.user
}
