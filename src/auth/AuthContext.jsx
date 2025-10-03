import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import supabase from '../lib/supabase'
import { loginEmailSenha, registrarEmailSenha, logout as logoutSvc } from './service'

const AuthContext = createContext(null)

async function fetchSubscriptionStatus(token) {
  if (!token) return null
  try {
    const res = await fetch('/api/bootstrap', {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      return data.subscription
    }
  } catch (e) { console.error('Failed to fetch subscription', e) }
  return null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [claims] = useState({ tenantId: 'default', roles: { VIEWER: true } })
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  const handleUser = async (sessionUser) => {
    if (!sessionUser) {
      setUser(null)
      setSubscription(null)
      return
    }
    setUser({ uid: sessionUser.id, email: sessionUser.email })
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const sub = await fetchSubscriptionStatus(session.access_token)
      setSubscription(sub)
    }
  }

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    const bootstrap = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      await handleUser(user)
      setLoading(false)
    }
    bootstrap()

    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      handleUser(sess?.user)
    })
    return () => { sub?.subscription?.unsubscribe?.() }
  }, [])

  const saveProfile = async () => {}

  const register = async ({ email, password, name, cpfCnpj, phone }) => {
    const u = await registrarEmailSenha(email, password, { name, cpfCnpj, phone })
    await handleUser(u)
    await saveProfile(u.uid, { email, name })
    return u
  }
  const login = async (email, password) => {
    const u = await loginEmailSenha(email, password)
    await handleUser(u)
    return u
  }
  const logout = async () => {
    await logoutSvc()
    setUser(null)
    setSubscription(null)
  }

  const value = useMemo(() => ({ user, claims, subscription, loading, register, login, logout }), [user, claims, subscription, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

