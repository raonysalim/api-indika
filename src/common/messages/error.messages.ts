// src/common/messages/validation.messages.ts

export const ErrorMessages = {
  // Campos genéricos
  required: (field: string) => `${field} is required`,

  env: {
    invalid: 'env invalid',
  },
} as const;

// Tipo utilitário para autocomplete
export type ValidationMessageKey = keyof typeof ErrorMessages;
