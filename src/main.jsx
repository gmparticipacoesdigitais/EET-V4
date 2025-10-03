import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/layouts.css'
import './styles/_fundos.css'
import './index.css'
import AppLayout from './layout/AppLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Funcionarios from './pages/Funcionarios.jsx'
import Relatorios from './pages/Relatorios.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import AuthGate from './auth/AuthGate.jsx'
import AuthPage from './pages/AuthPage.jsx'
import CheckoutSuccess from './pages/CheckoutSuccess.jsx'
import CheckoutCancel from './pages/CheckoutCancel.jsx'
import SubscribePage from './pages/SubscribePage.jsx'
import SubscribeSuccess from './pages/SubscribeSuccess.jsx'
import SubscribeCancel from './pages/SubscribeCancel.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/checkout/success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
          <Route path="/checkout/cancel" element={<ProtectedRoute><CheckoutCancel /></ProtectedRoute>} />
          <Route path="/subscribe" element={<ProtectedRoute><SubscribePage /></ProtectedRoute>} />
          <Route path="/subscribe/success" element={<ProtectedRoute><SubscribeSuccess /></ProtectedRoute>} />
          <Route path="/subscribe/cancel" element={<ProtectedRoute><SubscribeCancel /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><AuthGate><AppLayout /></AuthGate></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="funcionarios" element={<Funcionarios />} />
            <Route path="relatorios" element={<Relatorios />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
