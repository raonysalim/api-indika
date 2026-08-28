export const OTP_CONFIG = {
  EMAIL_VERIFICATION: { ttlMinutes: 10, maxAttempts: 5, cooldownMinutes: 1 },
  PASSWORD_RESET: { ttlMinutes: 15, maxAttempts: 3, cooldownMinutes: 5 },
} as const;
