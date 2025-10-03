import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import supabase from '../lib/supabase'

async function handleSubscribe(e) {
  e.preventDefault()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) { alert('Você precisa estar logado para assinar.'); return }
  const token = session.access_token
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  })
  const { url } = await res.json()
  if (url) window.location.assign(url)
}

export default function SubscribePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const onSubscribeClick = (e) => {
    e.preventDefault()
    setLoading(true)
    handleSubscribe(e).finally(() => setLoading(false))
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <main className="auth-card" role="main" aria-labelledby="subscribeTitle">
          <div className="flex items-center" style={{ gap: 12, marginBottom: 12 }}>
            <span className="inline-flex" aria-hidden style={{ height: 36, width: 36 }}>
              <span style={{ display: 'block', height: '100%', width: '100%', borderRadius: 8, background: 'linear-gradient(135deg, rgba(139,92,246,.9), rgba(14,165,233,.8))' }} />
            </span>
            <h1 id="subscribeTitle" style={{ margin: 0 }}>Assinatura necessária</h1>
          </div>
          <p className="text-soft" style={{ marginTop: -8 }}>Plano mensal via Stripe.</p>
          <button onClick={onSubscribeClick} disabled={loading || !user} className="btn btn-primary" aria-live="polite">
            {loading ? 'Processando...' : 'Assinar agora'}
          </button>
          <div className="grid" style={{ gap: 12, marginTop: 16 }}><a className="btn btn-secondary" href="/">Voltar</a></div>
        </main>
      </div>
    </div>
  )
}
