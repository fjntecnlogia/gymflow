import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

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
