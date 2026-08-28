import { ValidationMessages } from './validation.messages';

describe('ValidationMessages', () => {
  it('should be defined', () => {
    expect(ValidationMessages).toBeDefined();
  });

  it('should expose the required helper', () => {
    expect(ValidationMessages.required('email')).toBe('email is required');
  });

  it('should expose email messages', () => {
    expect(ValidationMessages.email.invalid).toBe(
      'Please provide a valid email address',
    );
    expect(ValidationMessages.email.alreadyExists).toBe(
      'This email is already registered',
    );
  });

  it('should expose password messages', () => {
    expect(ValidationMessages.password.minLength).toBe(
      'Password must be at least 8 characters',
    );
    expect(ValidationMessages.password.complexity).toBe(
      'Password must contain uppercase, lowercase, number and special character',
    );
    expect(ValidationMessages.password.mismatch).toBe('Passwords do not match');
  });

  it('should expose age messages', () => {
    expect(ValidationMessages.age.min(18)).toBe('Must be at least 18 years old');
    expect(ValidationMessages.age.invalidDate).toBe('Invalid date format');
  });

  it('should expose name messages', () => {
    expect(ValidationMessages.name.minLength).toBe(
      'Name must be at least 2 characters',
    );
    expect(ValidationMessages.name.maxLength).toBe(
      'Name cannot exceed 100 characters',
    );
  });

  it('should expose sign messages', () => {
    expect(ValidationMessages.sign.invalidCredencial).toBe(
      'Invalid credentials',
    );
  });

  it('should expose token messages', () => {
    expect(ValidationMessages.token.refreshEmpty).toBe(
      'Refresh token is required',
    );
  });
});