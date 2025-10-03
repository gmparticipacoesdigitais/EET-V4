import { useEffect } from 'react'
import { useAuth } from './AuthContext'

function SpinnerPage({ text = 'Validando acesso...' }) {
  return (
    <div className="auth-page" aria-busy="true" aria-live="polite">
      <div className="auth-container">
        <main className="auth-card" role="status" aria-label={text}>
          <div className="flex items-center" style={{ gap: 12 }}>
            <span className="inline-flex" aria-hidden style={{ height: 24, width: 24 }}>
              <span style={{ display: 'block', height: '100%', width: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(139,92,246,.9), rgba(14,165,233,.8))' }} />
            </span>
            <div className="caption text-soft">{text}</div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function AuthGate({ children }) {
  const { user, subscription, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user) {
      window.location.assign('/login')
      return
    }

    const DEV_EMAIL = (import.meta && import.meta.env && import.meta.env.VITE_DEV_EMAIL) || 'gmparticipacoes@gmail.com'
    const isDev = user?.email === DEV_EMAIL || user?.uid === 'dev'
    const hasActiveSub = subscription?.active === true

    if (!isDev && !hasActiveSub) {
      window.location.assign('/subscribe')
    }
  }, [user, subscription, loading])

  if (loading) {
    return <SpinnerPage text="Validando acesso..." />
  }

  const DEV_EMAIL = (import.meta && import.meta.env && import.meta.env.VITE_DEV_EMAIL) || 'gmparticipacoes@gmail.com'
  const isDev = user?.email === DEV_EMAIL || user?.uid === 'dev'
  const hasActiveSub = subscription?.active === true
  const isAllowed = user && (isDev || hasActiveSub)

  return isAllowed ? children : <SpinnerPage text="Verificando assinatura..." />
}
