import { ErrorMessages } from './error.messages';

describe('ErrorMessages', () => {
  it('should be defined', () => {
    expect(ErrorMessages).toBeDefined();
  });

  it('should expose the required helper', () => {
    expect(ErrorMessages.required('password')).toBe('password is required');
  });

  it('should expose the env invalid message', () => {
    expect(ErrorMessages.env.invalid).toBe('env invalid');
  });
});