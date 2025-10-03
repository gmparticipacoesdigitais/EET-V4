import supabase from '../lib/supabase'
import { loginEmailSenha, registrarEmailSenha } from './service'
import { validateLoginForm, validateRegisterForm } from '../utils/validation'
import {
  MessageManager,
  LoadingManager,
  FormUtils,
  PasswordToggle,
  TabManager,
  RedirectManager
} from '../utils/ui'

/**
 * Login page controller for the legacy HTML entrypoint.
 * Uses Supabase email/password auth and provides developer shortcuts.
 */
class LoginPageManager {
  private messageManager: MessageManager
  private loadingManager: LoadingManager
  private tabManager: TabManager

  // DOM Elements
  private loginForm: HTMLFormElement
  private registerForm: HTMLFormElement
  private devBtn: HTMLButtonElement | null
  private supportBtn: HTMLButtonElement | null

  constructor() {
    this.messageManager = new MessageManager()
    this.loadingManager = new LoadingManager()
    this.tabManager = new TabManager('login', () => this.messageManager.hide())

    this.initializeElements()
    this.setupEventListeners()
    void this.checkAuthState()
  }

  /**
   * Initialize DOM elements with basic guard rails
   */
  private initializeElements(): void {
    this.loginForm = document.getElementById('login-form') as HTMLFormElement
    this.registerForm = document.getElementById('register-form') as HTMLFormElement
    this.devBtn = document.getElementById('btn-dev-login') as HTMLButtonElement | null
    this.supportBtn = document.getElementById('btn-support') as HTMLButtonElement | null

    if (!this.loginForm || !this.registerForm) {
      console.error('Login DOM elements missing')
      this.messageManager.error('Erro ao carregar a pagina. Recarregue e tente novamente.')
    }
  }

  /**
   * Wire up events and enrich behaviour
   */
  private setupEventListeners(): void {
    this.loginForm?.addEventListener('submit', (event) => this.handleLoginSubmit(event))
    this.registerForm?.addEventListener('submit', (event) => this.handleRegisterSubmit(event))

    this.devBtn?.addEventListener('click', () => this.handleDevLogin())

    // Removido: opção de esqueci minha senha e listener associado

    PasswordToggle.setupAll()
    this.setupPasswordConfirmationValidation()
    this.setupRealTimeValidation()
  }

  /**
   * Check if there is an active Supabase session and redirect accordingly
   */
  private async checkAuthState(): Promise<void> {
    if (!supabase) return

    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error

      if (data?.session) {
        RedirectManager.redirect('/', 'Sessao ativa. Redirecionando...', 400)
        return
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          RedirectManager.redirect('/', 'Sessao ativa. Redirecionando...', 200)
        }
      })
    } catch (checkError) {
      console.error('Auth state check failed:', checkError)
    }
  }

  /**
   * Setup real-time password confirmation validation
   */
  private setupPasswordConfirmationValidation(): void {
    const confirmPasswordInput = document.getElementById('register-confirm-password') as HTMLInputElement
    const passwordInput = document.getElementById('register-password') as HTMLInputElement

    if (confirmPasswordInput && passwordInput) {
      confirmPasswordInput.addEventListener('input', () => {
        const password = passwordInput.value
        const confirmPassword = confirmPasswordInput.value

        if (confirmPassword) {
          if (password === confirmPassword) {
            FormUtils.applySuccessStyle(confirmPasswordInput)
          } else {
            FormUtils.applyErrorStyle(confirmPasswordInput)
          }
        } else {
          FormUtils.resetInputStyle(confirmPasswordInput)
        }
      })
    }
  }

  /**
   * Setup real-time validation for form inputs
   */
  private setupRealTimeValidation(): void {
    const emailInputs = document.querySelectorAll('input[type="email"]')
    emailInputs.forEach((input) => {
      input.addEventListener('blur', () => {
        const emailInput = input as HTMLInputElement
        if (emailInput.value) {
          const validation = validateLoginForm(emailInput.value, 'dummy')
          if (!validation.isValid) {
            FormUtils.applyErrorStyle(emailInput)
          } else {
            FormUtils.applySuccessStyle(emailInput)
          }
        }
      })
    })
  }

  /**
   * Handle login form submission
   */
  private async handleLoginSubmit(event: Event): Promise<void> {
    event.preventDefault()

    if (this.loadingManager.isLoading()) return

    const formData = FormUtils.getFormData(this.loginForm)
    const { email, password } = formData

    const validation = validateLoginForm(email, password)
    if (!validation.isValid) {
      this.messageManager.error(validation.message!)
      return
    }

    this.loadingManager.setLoading('login', true)
    this.messageManager.info('Entrando...')

    try {
      await loginEmailSenha(email, password)
      this.messageManager.success('Login realizado com sucesso!')
      RedirectManager.redirect('/')
    } catch (error: any) {
      console.error('Login error:', error)
      this.messageManager.error(error.message || 'Erro ao fazer login. Tente novamente.')
    } finally {
      this.loadingManager.setLoading('login', false)
    }
  }

  /**
   * Handle register form submission
   */
  private async handleRegisterSubmit(event: Event): Promise<void> {
    event.preventDefault()

    if (this.loadingManager.isLoading()) return

    const formData = FormUtils.getFormData(this.registerForm)
    const { name, email, password, confirmPassword } = formData

    const validation = validateRegisterForm(name, email, password, confirmPassword)
    if (!validation.isValid) {
      this.messageManager.error(validation.message!)
      return
    }

    this.loadingManager.setLoading('register', true)
    this.messageManager.info('Criando conta...')

    try {
      await registrarEmailSenha(email, password)
      this.messageManager.success('Conta criada com sucesso!')
      RedirectManager.redirect('/')
    } catch (error: any) {
      console.error('Register error:', error)
      this.messageManager.error(error.message || 'Erro ao criar conta. Tente novamente.')
    } finally {
      this.loadingManager.setLoading('register', false)
    }
  }

  /**
   * Abrir suporte r�pido via WhatsApp
   */
  private handleSupportRequest(): void {
    const emailInput = document.getElementById('login-email') as HTMLInputElement
    const emailValue = emailInput?.value?.trim()
    const message = encodeURIComponent(`Ola! Preciso de ajuda com o acesso. Meu e-mail: ${emailValue || 'sem e-mail informado'}`)

    this.messageManager.info('Abrindo suporte no WhatsApp...')
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank', 'noopener,noreferrer')
  }

  /**
   * Handle developer login
   */
  private async handleDevLogin(): Promise<void> {
    if (this.loadingManager.isLoading()) return

    const devEmail = 'gmparticipacoes@gmail.com'
    const devPassword = 'gmparticipacoes1234!'

    this.loadingManager.setLoading('dev', true)
    this.messageManager.info('Fazendo login como desenvolvedor...')

    try {
      await loginEmailSenha(devEmail, devPassword)
      this.messageManager.success('Login de desenvolvedor realizado com sucesso!')
      RedirectManager.redirect('/')
    } catch (error: any) {
      console.error('Dev login error:', error)

      if (error.code === 'auth/user-not-found') {
        try {
          this.messageManager.info('Criando conta de desenvolvedor...')
          await registrarEmailSenha(devEmail, devPassword)
          this.messageManager.success('Conta de desenvolvedor criada e login realizado!')
          RedirectManager.redirect('/')
        } catch (createError: any) {
          console.error('Dev account creation error:', createError)
          this.messageManager.error('Erro ao criar conta de desenvolvedor.')
        }
      } else {
        this.messageManager.error(error.message || 'Erro no login de desenvolvedor.')
      }
    } finally {
      this.loadingManager.setLoading('dev', false)
    }
  }

  /**
   * Cleanup method for removing event listeners
   */
  public cleanup(): void {
    this.loadingManager.clearAll()
    this.messageManager.hide()
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new LoginPageManager()
})

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  // placeholder for future cleanup if needed
})

export { LoginPageManager }
