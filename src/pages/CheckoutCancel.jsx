import { Link } from 'react-router-dom'

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-fuchsia-500/20 selection:text-fuchsia-300">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-6 flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-rose-600 to-orange-500 text-slate-50">!</span>
          <h1 className="text-2xl font-semibold">Checkout cancelado</h1>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-slate-300">Sua tentativa de pagamento foi cancelada. Você pode tentar novamente quando quiser.</p>
          <div className="mt-6">
            <Link to="/" className="rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm hover:bg-slate-900/80">Voltar ao app</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

