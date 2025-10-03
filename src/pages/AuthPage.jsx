import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useNavigate } from 'react-router-dom'
import Input from '../components/Input'
import Button from '../components/Button'
import ToastStack from '../components/Toast.jsx'
import '../styles/auth-enhanced.css'

const DEV_EMAIL = (import.meta && import.meta.env && import.meta.env.VITE_DEV_EMAIL) || 'gmparticipacoes@gmail.com'
const DEV_PASSWORD = (import.meta && import.meta.env && import.meta.env.VITE_DEV_PASSWORD) || 'gmparticipacoes1234!'

export default function AuthPage() {
  const { login, register, user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', name: '', cpfCnpj: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const errRef = useRef(null)

  useEffect(() => {
    if (error && errRef.current) {
      try { errRef.current.focus() } catch {}
    }
  }, [error])

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  const handleModeChange = (nextMode) => {
    if (nextMode === mode) return
    setMode(nextMode)
    setError('')
  }

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        if (!form.name.trim()) throw new Error('Informe seu nome completo')
        if (form.password.length < 8) throw new Error('A senha deve ter no minimo 8 caracteres')
        await register({ email: form.email, password: form.password, name: form.name.trim(), cpfCnpj: form.cpfCnpj, phone: form.phone })
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Nao foi possivel autenticar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleDevLogin = async () => {
    setError('')
    setLoading(true)
    try {
      await login(DEV_EMAIL, DEV_PASSWORD)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Falha no login de desenvolvedor.')
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppReset = () => {
    const message = encodeURIComponent(`Ola! Preciso de ajuda com o acesso. Meu e-mail: ${form.email || 'sem e-mail informado'}`)
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank', 'noopener,noreferrer')
  }

  const modeCopy = mode === 'login'
    ? {
        headline: 'Entrar na sua conta',
        subtitle: 'Use suas credenciais para acessar os calculos e provisoes em andamento.',
        action: 'Entrar agora',
        switchLabel: 'Nao tem conta ainda? ',
        switchAction: 'Criar acesso'
      }
    : {
        headline: 'Criar uma nova conta',
        subtitle: 'Cadastre os dados da empresa para monitorar encargos e colaboradores.',
        action: 'Criar conta',
        switchLabel: 'Ja possui login? ',
        switchAction: 'Fazer login'
      }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-hero" aria-hidden="true">
          <span className="auth-hero__badge">Operacao confiavel</span>
          <h1>Encargos sob controle total</h1>
          <p>Centralize previsoes de folha, acompanhe encargos legais e compartilhe relat�rios em minutos.</p>
          <ul className="auth-hero__highlights">
            <li>Visao mensal de encargos e provisoes</li>
            <li>Alertas para vencimentos criticos</li>
            <li>Exportacao pronta para contabilidade</li>
          </ul>
        </section>

        <main className="auth-card" role="main" aria-labelledby="authTitle">
          <header className="auth-card__header">
            <div>
              <h2 id="authTitle">{modeCopy.headline}</h2>
              <p className="auth-card__subtitle">{modeCopy.subtitle}</p>
            </div>
          </header>

          {error && (
            <div ref={errRef} role="alert" className="auth-alert auth-alert--danger" tabIndex={-1}>
              {error}
            </div>
          )}

          <div className="auth-tabs" role="tablist" aria-label="Alterar modo de acesso">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={`auth-tab ${mode === 'login' ? 'is-active' : ''}`}
              onClick={() => handleModeChange('login')}
            >
              Entrar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={`auth-tab ${mode === 'signup' ? 'is-active' : ''}`}
              onClick={() => handleModeChange('signup')}
            >
              Criar conta
            </button>
            {/* Dev login ocultado: removida a aba/acao explicita */}
          </div>

          <p className="auth-caption">
            {modeCopy.switchLabel}
            <button type="button" className="auth-link" onClick={() => handleModeChange(mode === 'login' ? 'signup' : 'login')}>
              {modeCopy.switchAction}
            </button>
          </p>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {mode === 'signup' && (
              <fieldset className="auth-form__group" aria-label="Dados da empresa">
                <Input
                  label="Nome completo"
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  placeholder="Digite como consta nos documentos"
                  autoComplete="name"
                  required
                />
                <Input
                  label="CPF ou CNPJ"
                  name="cpfCnpj"
                  value={form.cpfCnpj}
                  onChange={onChange}
                  placeholder="Somente numeros"
                  autoComplete="off"
                />
                <Input
                  label="Telefone"
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  placeholder="DDD + numero"
                  autoComplete="tel"
                />
              </fieldset>
            )}

            <fieldset className="auth-form__group" aria-label="Credenciais">
              <Input
                label="E-mail"
                name="email"
                value={form.email}
                onChange={onChange}
                type="email"
                placeholder="nome@empresa.com"
                autoComplete="email"
                required
              />
              <Input
                label="Senha"
                name="password"
                value={form.password}
                onChange={onChange}
                type="password"
                placeholder="No minimo 8 caracteres"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
              {/* Opção de manter sessão ativa removida */}
            </fieldset>

            <div className="auth-actions">
              <Button type="submit" variant="primary" disabled={loading} aria-live="polite">
                {loading ? 'Aguarde...' : modeCopy.action}
              </Button>
              <Button type="button" variant="secondary" onClick={handleWhatsAppReset}>
                Falar com suporte
              </Button>
            </div>
          </form>

          <section className="auth-support" aria-live="polite">
            <div>
              <span className="auth-support__badge">Suporte humano</span>
              <h3>Equipe pronta para destravar acessos</h3>
              <p>Atendimento em horario comercial com retorno medio de 30 minutos.</p>
            </div>
            <div className="auth-support__actions">
              <Button type="button" variant="ghost" onClick={handleWhatsAppReset}>
                Abrir WhatsApp
              </Button>
              <button type="button" className="auth-link" onClick={() => setError('Envio por e-mail disponivel em breve.')}>Receber por e-mail</button>
            </div>
          </section>

          <footer className="auth-footer">
            <div className="auth-footer__links">
              Contato: <a href="mailto:contato@simulador.auditoriaemfoco.com" className="auth-link">contato@simulador.auditoriaemfoco.com</a>
            </div>
          </footer>
        </main>
      </div>
      <ToastStack />
    </div>
  )
}
