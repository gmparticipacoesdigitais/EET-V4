export default function SubscribeCancel() {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <main className="auth-card" role="main" aria-labelledby="cancelTitle">
          <h1 id="cancelTitle" style={{ marginTop: 0 }}>Assinatura não concluída</h1>
          <p className="text-soft">Você cancelou o checkout. Se quiser tentar novamente, clique abaixo.</p>
          <div className="grid" style={{ gap: 12, marginTop: 12 }}>
            <a href="/subscribe" className="btn btn-primary">Tentar novamente</a>
            <a href="/" className="btn btn-secondary">Voltar</a>
          </div>
        </main>
      </div>
    </div>
  )
}

