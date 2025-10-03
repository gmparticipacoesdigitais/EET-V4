import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'

export default function CheckoutSuccess() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const [loading, setLoading] = useState(Boolean(sessionId))
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      if (!sessionId) return
      setLoading(true)
      setError('')
      try {
        const base = import.meta.env.VITE_PUBLIC_BASE_URL || ''
        const res = await fetch(`${base}/api/checkout/session/${sessionId}`)
        if (!res.ok) throw new Error('Falha ao carregar sessão')
        const json = await res.json()
        setData(json)
      } catch (e) {
        setError(e.message || 'Erro ao consultar sessão')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [sessionId])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-fuchsia-500/20 selection:text-fuchsia-300">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-6 flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-fuchsia-600 to-cyan-500 text-slate-50">✓</span>
          <h1 className="text-2xl font-semibold">Pagamento concluído</h1>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-slate-300">Obrigado! Sua assinatura foi iniciada com sucesso.</p>
          {sessionId && (
            <p className="mt-2 text-sm text-slate-400">ID da sessão: <span className="font-mono">{sessionId}</span></p>
          )}
          {loading && <p className="mt-4 text-sm text-slate-400">Carregando detalhes…</p>}
          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
          {data && (
            <div className="mt-4 text-sm text-slate-300">
              <p>Status: <span className="font-medium">{data.status}</span></p>
              {data.customer_email && <p>E-mail: {data.customer_email}</p>}
            </div>
          )}
          <div className="mt-6">
            <Link to="/" className="rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm hover:bg-slate-900/80">Voltar ao app</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

