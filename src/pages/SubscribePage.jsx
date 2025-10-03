import { useEffect } from 'react'

export default function SubscribePage() {
  const href = (import.meta && import.meta.env && import.meta.env.VITE_HOTMART_PAY_URL) || 'https://pay.hotmart.com/Q102005462K?checkoutMode=2'

  useEffect(() => {
    const s = document.createElement('script'); s.src = 'https://static.hotmart.com/checkout/widget.min.js'; document.head.appendChild(s)
    const l = document.createElement('link'); l.rel='stylesheet'; l.href='https://static.hotmart.com/css/hotmart-fb.min.css'; document.head.appendChild(l)
    return () => { try { document.head.removeChild(s); document.head.removeChild(l) } catch {} }
  }, [])

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
          <p className="text-soft" style={{ marginTop: -8 }}>Plano mensal R$ 9,90 via Hotmart.</p>
          <a onClick={(e)=>e.preventDefault()} href={href} target="_blank" rel="noopener noreferrer" className="hotmart-fb hotmart__button-checkout"><img alt="Comprar" src='https://static.hotmart.com/img/btn-buy-green.png' /></a>
          <div className="grid" style={{ gap: 12, marginTop: 16 }}><a className="btn btn-secondary" href="/">Voltar</a></div>
        </main>
      </div>
    </div>
  )
}
