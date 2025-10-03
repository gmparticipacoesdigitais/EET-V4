import { useEffect, useState } from 'react'
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
  const { user } = useAuth()
  const [state, setState] = useState({ loading: true, allowed: false })

  useEffect(() => {
    const run = () => {
      if (!user) { window.location.assign('/login'); return }
      const DEV_EMAIL = (import.meta && import.meta.env && import.meta.env.VITE_DEV_EMAIL) || 'gmparticipacoes@gmail.com'
      if (user?.email === DEV_EMAIL || user?.uid === 'dev') { setState({ loading: false, allowed: true }); return }
      window.location.assign('/subscribe')
    }
    run()
  }, [user])

  if (state.loading) return <SpinnerPage text="Validando acesso..." />
  return state.allowed ? children : null
}
