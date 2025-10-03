/**
 * UI utilities for managing messages, loading states, and DOM interactions
 */

export type MessageType = 'error' | 'success' | 'info' | 'warning';

export interface MessageOptions {
  type: MessageType;
  text: string;
  timeout?: number;
  autoHide?: boolean;
}

/**
 * Message manager for displaying user feedback
 */
export class MessageManager {
  private messageEl: HTMLElement | null;
  private hideTimeout: number | null = null;

  constructor(messageElementId: string = 'message') {
    this.messageEl = document.getElementById(messageElementId);
  }

  /**
   * Show a message to the user
   */
  show(options: MessageOptions): void {
    if (!this.messageEl) return;

    // Clear any existing timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    this.messageEl.textContent = options.text;
    this.messageEl.className = `message show ${options.type}`;

    // Auto-hide for success and info messages
    const shouldAutoHide = options.autoHide !== false && 
      (options.type === 'success' || options.type === 'info');
    
    if (shouldAutoHide) {
      const timeout = options.timeout || 5000;
      this.hideTimeout = window.setTimeout(() => this.hide(), timeout);
    }
  }

  /**
   * Hide the current message
   */
  hide(): void {
    if (!this.messageEl) return;

    this.messageEl.classList.remove('show');
    setTimeout(() => {
      if (this.messageEl) {
        this.messageEl.textContent = '';
        this.messageEl.className = 'message';
      }
    }, 300);

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  /**
   * Show error message
   */
  error(text: string, timeout?: number): void {
    this.show({ type: 'error', text, timeout, autoHide: false });
  }

  /**
   * Show success message
   */
  success(text: string, timeout?: number): void {
    this.show({ type: 'success', text, timeout });
  }

  /**
   * Show info message
   */
  info(text: string, timeout?: number): void {
    this.show({ type: 'info', text, timeout });
  }

  /**
   * Show warning message
   */
  warning(text: string, timeout?: number): void {
    this.show({ type: 'warning', text, timeout, autoHide: false });
  }
}

/**
 * Loading state manager for buttons and forms
 */
export class LoadingManager {
  private loadingStates: Map<string, boolean> = new Map();

  /**
   * Set loading state for a specific context
   */
  setLoading(context: string, loading: boolean): void {
    this.loadingStates.set(context, loading);
    this.updateButtonState(context, loading);
  }

  /**
   * Check if a context is currently loading
   */
  isLoading(context?: string): boolean {
    if (context) {
      return this.loadingStates.get(context) || false;
    }
    // Check if any context is loading
    return Array.from(this.loadingStates.values()).some(loading => loading);
  }

  /**
   * Update button visual state based on loading
   */
  private updateButtonState(context: string, loading: boolean): void {
    const buttonSelectors: Record<string, string> = {
      login: '#login-form .btn-primary',
      register: '#register-form .btn-primary',
      dev: '#btn-dev-login'
    };
    const selector = buttonSelectors[context];
    if (!selector) return;

    const button = document.querySelector(selector) as HTMLButtonElement;
    if (!button) return;

    button.disabled = loading;
    button.classList.toggle('loading', loading);

    // Update all buttons to be disabled when any is loading
    const allButtons = Object.values(buttonSelectors)
      .map(sel => document.querySelector(sel) as HTMLButtonElement)
      .filter(btn => btn);

    const anyLoading = this.isLoading();
    allButtons.forEach(btn => {
      if (btn !== button) {
        btn.disabled = anyLoading;
      }
    });
  }

  /**
   * Clear all loading states
   */
  clearAll(): void {
    this.loadingStates.clear();
    // Reset all buttons
    const buttonSelectors = [
      '#login-form .btn-primary',
      '#register-form .btn-primary',
      '#btn-dev-login'
    ];

    buttonSelectors.forEach(selector => {
      const button = document.querySelector(selector) as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.classList.remove('loading');
      }
    });
  }
}

/**
 * Form utilities for common operations
 */
export class FormUtils {
  /**
   * Get form data as an object
   */
  static getFormData(form: HTMLFormElement): Record<string, string> {
    const formData = new FormData(form);
    const data: Record<string, string> = {};
    
    for (const [key, value] of formData.entries()) {
      data[key] = value as string;
    }
    
    return data;
  }

  /**
   * Clear form validation styles
   */
  static clearValidationStyles(form: HTMLFormElement): void {
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
      input.style.borderColor = '';
      input.style.boxShadow = '';
    });
  }

  /**
   * Apply validation error style to input
   */
  static applyErrorStyle(input: HTMLInputElement): void {
    input.style.borderColor = '#e53e3e';
    input.style.boxShadow = '0 0 0 3px rgba(229, 62, 62, 0.1)';
  }

  /**
   * Apply success style to input
   */
  static applySuccessStyle(input: HTMLInputElement): void {
    input.style.borderColor = '#38a169';
    input.style.boxShadow = '0 0 0 3px rgba(56, 161, 105, 0.1)';
  }

  /**
   * Reset input style to default
   */
  static resetInputStyle(input: HTMLInputElement): void {
    input.style.borderColor = '#e2e8f0';
    input.style.boxShadow = 'none';
  }
}

/**
 * Password visibility toggle utility
 */
export class PasswordToggle {
  /**
   * Toggle password visibility for a specific input
   */
  static toggle(targetId: string): void {
    const input = document.getElementById(targetId) as HTMLInputElement;
    const button = document.querySelector(`[data-target="${targetId}"]`) as HTMLButtonElement;
    const icon = button?.querySelector('i') as HTMLElement;

    if (!input || !button || !icon) return;

    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fas fa-eye-slash';
      button.setAttribute('aria-label', 'Ocultar senha');
    } else {
      input.type = 'password';
      icon.className = 'fas fa-eye';
      button.setAttribute('aria-label', 'Mostrar senha');
    }
  }

  /**
   * Setup password toggle for all toggle buttons
   */
  static setupAll(): void {
    document.querySelectorAll('.toggle-password').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = button.getAttribute('data-target');
        if (targetId) {
          PasswordToggle.toggle(targetId);
        }
      });
    });
  }
}

/**
 * Tab management utility
 */
export class TabManager {
  private currentTab: string;
  private onTabChange?: (tab: string) => void;

  constructor(defaultTab: string, onTabChange?: (tab: string) => void) {
    this.currentTab = defaultTab;
    this.onTabChange = onTabChange;
    this.setupTabListeners();
  }

  /**
   * Switch to a specific tab
   */
  switchTo(tab: string): void {
    this.currentTab = tab;
    this.updateTabUI(tab);
    this.onTabChange?.(tab);
  }

  /**
   * Get current active tab
   */
  getCurrent(): string {
    return this.currentTab;
  }

  /**
   * Setup event listeners for tab buttons
   */
  private setupTabListeners(): void {
    document.querySelectorAll('[data-tab]').forEach(button => {
      button.addEventListener('click', () => {
        const tab = button.getAttribute('data-tab');
        if (tab) {
          this.switchTo(tab);
        }
      });
    });
  }

  /**
   * Update tab UI elements
   */
  private updateTabUI(activeTab: string): void {
    // Update tab buttons
    document.querySelectorAll('[data-tab]').forEach(button => {
      const tab = button.getAttribute('data-tab');
      button.classList.toggle('active', tab === activeTab);
    });

    // Update form visibility
    document.querySelectorAll('.auth-form').forEach(form => {
      const formId = form.id;
      const isActive = formId === `${activeTab}-form`;
      form.classList.toggle('active', isActive);
    });
  }
}

/**
 * Utility for smooth redirects with loading indication
 */
export class RedirectManager {
  /**
   * Redirect with loading message and delay
   */
  static redirect(url: string, message: string = 'Redirecionando...', delay: number = 1000): void {
    const messageManager = new MessageManager();
    messageManager.success(message);
    
    setTimeout(() => {
      window.location.assign(url);
    }, delay);
  }
}



