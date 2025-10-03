import { useAuth } from '../auth/AuthContext'
// Assinatura é gerenciada via página dedicada

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth()
  return (
    <div className="header-bar">
      <div className="header-left">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md" aria-hidden>
          <span className="h-full w-full rounded-md" style={{
            background: 'radial-gradient(120% 120% at 20% -10%, rgba(167,139,250,.6), transparent 50%), linear-gradient(135deg, rgba(139,92,246,.9), rgba(14,165,233,.8))'
          }} />
        </span>
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--color-ink)', margin: 0 }}>Encargos Trabalhistas</h1>
        </div>
      </div>
      <div className="header-right">
        <button type="button" className="btn btn-secondary" onClick={onToggleSidebar} aria-label="Abrir menu">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Menu
        </button>
        <a href="/subscribe" className="btn btn-primary">Assinar</a>
        {user && (
          <button type="button" className="btn btn-logout" onClick={logout} aria-label="Sair da aplicação">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10 17l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Sair
          </button>
        )}
      </div>
    </div>
  )
}
