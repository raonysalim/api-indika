import {
  UserNotFoundException,
  EmailAlreadyVerifiedException,
} from './user.exceptions';

describe('User exceptions', () => {
  describe('UserNotFoundException', () => {
    it('should be defined', () => {
      expect(UserNotFoundException).toBeDefined();
    });

    it('should be a NotFoundException with the default message', () => {
      const err = new UserNotFoundException();
      expect(err.getStatus()).toBe(404);
      expect(err.message).toBe('User not found');
    });
  });

  describe('EmailAlreadyVerifiedException', () => {
    it('should be defined', () => {
      expect(EmailAlreadyVerifiedException).toBeDefined();
    });

    it('should be a ConflictException with the default message', () => {
      const err = new EmailAlreadyVerifiedException();
      expect(err.getStatus()).toBe(409);
      expect(err.message).toBe('Email is already verified');
    });
  });
});