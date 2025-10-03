import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'

export default function SubscribeSuccess() {
  const { user } = useAuth()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Fluxo Hotmart simplificado: não validamos no backend aqui
    setChecking(false)
  }, [])

  return (
    <div className="auth-page">
      <div className="auth-container">
        <main className="auth-card" role="status" aria-label="Assinatura concluída">
          {checking ? (
            <div className="caption text-soft">Processando...</div>
          ) : (
            <>
              <h1 style={{ marginTop: 0 }}>Obrigado!</h1>
              <p className="text-soft">Se a compra foi concluída pela Hotmart, você já pode acessar o dashboard.</p>
              <div style={{ marginTop: 12 }}>
                <a href="/dashboard" className="btn btn-primary">Ir para o dashboard</a>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

