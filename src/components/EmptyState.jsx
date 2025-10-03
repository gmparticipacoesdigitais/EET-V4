export default function EmptyState({ title = 'Nada por aqui', subtitle = 'Comece adicionando novos dados.', action = null }) {
  return (
    <div className="card bg-fallback-gradient" style={{ textAlign: 'center' }}>
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ height: 80, background: 'radial-gradient(100% 100% at 50% 0%, rgba(167,139,250,.25), transparent)', borderRadius: 16 }} />
        <h3 style={{ margin: 0 }}>{title}</h3>
        <p style={{ color: 'var(--color-ink-soft)', marginTop: -4 }}>{subtitle}</p>
        {action}
      </div>
    </div>
  )
}

