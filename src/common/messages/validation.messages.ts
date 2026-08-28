// src/common/messages/validation.messages.ts

export const ValidationMessages = {
  // Campos genéricos
  required: (field: string) => `${field} is required`,

  // E-mail
  email: {
    invalid: 'Please provide a valid email address',
    alreadyExists: 'This email is already registered',
  },

  // Senha
  password: {
    minLength: 'Password must be at least 8 characters',
    complexity:
      'Password must contain uppercase, lowercase, number and special character',
    mismatch: 'Passwords do not match',
  },

  // Idade
  age: {
    min: (minAge: number) => `Must be at least ${minAge} years old`,
    invalidDate: 'Invalid date format',
  },

  // Nome
  name: {
    minLength: 'Name must be at least 2 characters',
    maxLength: 'Name cannot exceed 100 characters',
  },

  //
  sign: {
    invalidCredencial: 'Invalid credentials',
  },

  token: {
    refreshEmpty: 'Refresh token is required',
  },
} as const;

// Tipo utilitário para autocomplete
export type ValidationMessageKey = keyof typeof ValidationMessages;
