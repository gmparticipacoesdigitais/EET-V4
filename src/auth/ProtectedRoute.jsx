import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-8 text-soft" role="status" aria-live="polite">Carregando…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}
