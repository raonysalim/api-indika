import { OTP_CONFIG } from './otp.constants';

describe('OTP_CONFIG', () => {
  it('should be defined', () => {
    expect(OTP_CONFIG).toBeDefined();
  });

  it('should expose the email verification config', () => {
    expect(OTP_CONFIG.EMAIL_VERIFICATION).toEqual({
      ttlMinutes: 10,
      maxAttempts: 5,
      cooldownMinutes: 1,
    });
  });

  it('should expose the password reset config', () => {
    expect(OTP_CONFIG.PASSWORD_RESET).toEqual({
      ttlMinutes: 15,
      maxAttempts: 3,
      cooldownMinutes: 5,
    });
  });
});