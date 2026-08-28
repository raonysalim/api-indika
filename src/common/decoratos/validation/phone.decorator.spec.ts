/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { validateSync } from 'class-validator';
import { IsPhone } from './phone.decorator';

class TestUser {
  @IsPhone()
  phone: string | undefined;
}

class TestUserWithBRCountry {
  @IsPhone({ country: 'BR' })
  phone: string | undefined;
}

describe('IsPhone', () => {
  const validatePhone = (value: any): string[] => {
    const user = new TestUser();
    user.phone = value;
    const errors = validateSync(user);
    return errors.length ? Object.values(errors[0].constraints || {}) : [];
  };

  it('should be defined', () => {
    expect(IsPhone).toBeDefined();
  });

  it('should accept a valid Brazilian mobile number in compact format', () => {
    expect(validatePhone('11999999999')).toEqual([]);
  });

  it('should accept a valid mobile number with formatting', () => {
    expect(validatePhone('(11) 99999-9999')).toEqual([]);
  });

  it('should reject a formatted mobile number without a DDD (only 10 digits)', () => {
    // '99999-9999' tem 10 dígitos -> sem DDD, inválido para o formato brasileiro.
    expect(validatePhone('99999-9999')).not.toEqual([]);
  });

  it('should reject a number with a landline (DDD 11, but not starting with 9)', () => {
    expect(validatePhone('1133334444')).not.toEqual([]);
  });

  it('should reject an invalid DDD', () => {
    expect(validatePhone('10999999999')).not.toEqual([]);
  });

  it('should reject a number with the wrong length', () => {
    expect(validatePhone('1199999999')).not.toEqual([]); // 10 digits
    expect(validatePhone('119999999999')).not.toEqual([]); // 12 digits
  });

  it('should reject a non-string value', () => {
    expect(validatePhone(11999999999)).not.toEqual([]);
    expect(validatePhone(null)).not.toEqual([]);
  });

  it('should reject empty string', () => {
    expect(validatePhone('')).not.toEqual([]);
  });

  it('should keep working when country option is passed', () => {
    const user = new TestUserWithBRCountry();
    user.phone = '11999999999';
    const errors = validateSync(user);
    expect(errors).toEqual([]);
  });

  it('should expose a default error message', () => {
    const errors = validatePhone('123');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('Invalid phone number');
  });
});
