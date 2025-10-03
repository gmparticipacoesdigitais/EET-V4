/**
 * Validation utilities for forms and user input
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Validates email format using RFC 5322 compliant regex
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, message: 'E-mail é obrigatório.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Por favor, insira um e-mail válido.' };
  }

  return { isValid: true };
}

/**
 * Validates password strength and requirements
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, message: 'Senha é obrigatória.' };
  }

  if (password.length < 6) {
    return { isValid: false, message: 'A senha deve ter pelo menos 6 caracteres.' };
  }

  // Optional: Add more password strength requirements
  // const hasUpperCase = /[A-Z]/.test(password);
  // const hasLowerCase = /[a-z]/.test(password);
  // const hasNumbers = /\d/.test(password);
  // const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return { isValid: true };
}

/**
 * Validates password confirmation
 */
export function validatePasswordConfirmation(password: string, confirmPassword: string): ValidationResult {
  if (!confirmPassword) {
    return { isValid: false, message: 'Confirmação de senha é obrigatória.' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, message: 'As senhas não coincidem.' };
  }

  return { isValid: true };
}

/**
 * Validates name field
 */
export function validateName(name: string): ValidationResult {
  if (!name) {
    return { isValid: false, message: 'Nome é obrigatório.' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, message: 'Nome deve ter pelo menos 2 caracteres.' };
  }

  if (name.trim().length > 100) {
    return { isValid: false, message: 'Nome deve ter no máximo 100 caracteres.' };
  }

  return { isValid: true };
}

/**
 * Validates all required fields are filled
 */
export function validateRequiredFields(fields: Record<string, any>): ValidationResult {
  const emptyFields = Object.entries(fields)
    .filter(([key, value]) => !value || (typeof value === 'string' && !value.trim()))
    .map(([key]) => key);

  if (emptyFields.length > 0) {
    return { isValid: false, message: 'Por favor, preencha todos os campos obrigatórios.' };
  }

  return { isValid: true };
}

/**
 * Comprehensive form validation for login
 */
export function validateLoginForm(email: string, password: string): ValidationResult {
  const requiredCheck = validateRequiredFields({ email, password });
  if (!requiredCheck.isValid) return requiredCheck;

  const emailCheck = validateEmail(email);
  if (!emailCheck.isValid) return emailCheck;

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.isValid) return passwordCheck;

  return { isValid: true };
}

/**
 * Comprehensive form validation for registration
 */
export function validateRegisterForm(
  name: string, 
  email: string, 
  password: string, 
  confirmPassword: string
): ValidationResult {
  const requiredCheck = validateRequiredFields({ name, email, password, confirmPassword });
  if (!requiredCheck.isValid) return requiredCheck;

  const nameCheck = validateName(name);
  if (!nameCheck.isValid) return nameCheck;

  const emailCheck = validateEmail(email);
  if (!emailCheck.isValid) return emailCheck;

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.isValid) return passwordCheck;

  const confirmCheck = validatePasswordConfirmation(password, confirmPassword);
  if (!confirmCheck.isValid) return confirmCheck;

  return { isValid: true };
}

