import supabase from '../lib/supabase'

const DEV_EMAIL = (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env as any).VITE_DEV_EMAIL) || undefined
const DEV_PASSWORD = (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env as any).VITE_DEV_PASSWORD) || undefined

export async function registrarEmailSenha(email: string, password: string, data?: { name?: string; cpfCnpj?: string; phone?: string }) {
  if (!supabase) throw new Error('Supabase não configurado')
  const { data: created, error } = await supabase.auth.signUp({ email, password, options: { data } })
  if (error) throw error
  const user = created?.user
  if (!user) throw new Error('Conta criada. Verifique seu e-mail para confirmar o acesso.')
  if (!created.session) {
    try {
      const { data: loginData } = await supabase.auth.signInWithPassword({ email, password })
      if (loginData?.user) return { uid: loginData.user.id, email: loginData.user.email || email }
    } catch (e: any) {
      const msg = e?.message || 'Conta criada. Confirme o e-mail cadastrado para concluir o acesso.'
      throw new Error(msg)
    }
  }
  return { uid: user.id, email: user.email || email }
}

export async function loginEmailSenha(email: string, password: string) {
  if (DEV_EMAIL && DEV_PASSWORD && email === DEV_EMAIL && password === DEV_PASSWORD) return { uid: 'dev', email }
  if (!supabase) throw new Error('Supabase não configurado')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return { uid: data.user?.id || '', email: data.user?.email || email }
}

export function logout() {
  return supabase?.auth?.signOut?.()
}

export async function resetPasswordByEmail(email: string, redirectTo?: string) {
  if (!supabase) throw new Error('Supabase não configurado')
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  if (error) throw error
}

export async function loginGooglePopup() {
  throw new Error('Login com Google desativado')
}

export async function loginGoogleOneTap() {
  return null as any
}

