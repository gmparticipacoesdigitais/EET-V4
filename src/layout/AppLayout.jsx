import { NavLink, Outlet, useLocation } from 'react-router-dom'
import Header from '../components/Header.jsx'
import ToastStack from '../components/Toast.jsx'
import Sidebar from '../components/Sidebar.jsx'
import { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'
import { subscribeEmployees } from '../data/employees'

const AppCtx = createContext(null)
export function useAppCtx() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useAppCtx must be used within AppLayout')
  return ctx
}

export default function AppLayout() {
  const [funcionarios, setFuncionarios] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.uid) { setFuncionarios([]); return }
    const unsub = subscribeEmployees(user.uid, (list) => setFuncionarios(list || []))
    return () => unsub && unsub()
  }, [user?.uid])

  const ctxValue = useMemo(() => ({ funcionarios, setFuncionarios }), [funcionarios])

  return (
    <AppCtx.Provider value={ctxValue}>
      <header className="app-header header-gradient bg-noise">
        <div className="inner">
          <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        </div>
      </header>
      <div className="app-shell">
        <aside className="sidebar" aria-label="Menu lateral" data-open={sidebarOpen ? 'true' : 'false'}>
          <Sidebar />
        </aside>
        <main className="app-main" aria-live="polite">
          <Outlet context={{ funcionarios, setFuncionarios, route: location.pathname }} />
        </main>
      </div>
      <ToastStack />
    </AppCtx.Provider>
  )
}
