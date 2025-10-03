import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import supabase from '../lib/supabase'
import { loginEmailSenha, registrarEmailSenha, logout as logoutSvc } from './service'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [claims] = useState({ tenantId: 'default', roles: { VIEWER: true } })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data?.user ? { uid: data.user.id, email: data.user.email } : null)
      setLoading(false)
    })()
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setUser(sess?.user ? { uid: sess.user.id, email: sess.user.email } : null)
    })
    return () => { sub?.subscription?.unsubscribe?.() }
  }, [])

  const saveProfile = async () => {}

  const register = async ({ email, password, name, cpfCnpj, phone }) => {
    const u = await registrarEmailSenha(email, password, { name, cpfCnpj, phone })
    setUser({ uid: u.uid, email: u.email })
    await saveProfile(u.uid, { email, name })
    return u
  }
  const login = async (email, password) => {
    const u = await loginEmailSenha(email, password)
    setUser({ uid: u.uid, email: u.email })
    return u
  }
  const logout = () => { return logoutSvc() }

  const value = useMemo(() => ({ user, claims, loading, register, login, logout }), [user, claims, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

