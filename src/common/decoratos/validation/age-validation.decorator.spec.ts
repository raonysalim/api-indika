import { validateSync } from 'class-validator';
import { IsOfLegalAge } from './age-validation.decorator';

class TestUser {
  @IsOfLegalAge()
  birthday: string | Date | undefined;
}

const validateBirthday = (value: string | Date): string[] => {
  const user = new TestUser();
  user.birthday = value;
  const errors = validateSync(user);
  return errors.length ? Object.values(errors[0].constraints || {}) : [];
};

describe('IsOfLegalAge', () => {
  it('should be defined', () => {
    expect(IsOfLegalAge).toBeDefined();
  });

  it('should export a function', () => {
    expect(typeof IsOfLegalAge).toBe('function');
  });

  it('should accept a person aged exactly 18', () => {
    const today = new Date();
    const eighteenAgo = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate(),
    );
    expect(validateBirthday(eighteenAgo)).toEqual([]);
  });

  it('should accept a person older than 18', () => {
    expect(validateBirthday('1990-01-01')).toEqual([]);
  });

  it('should reject a person younger than 18', () => {
    const today = new Date();
    const tenAgo = new Date(
      today.getFullYear() - 10,
      today.getMonth(),
      today.getDate(),
    );
    expect(validateBirthday(tenAgo.toISOString())).not.toEqual([]);
  });

  it('should reject a Date object of a minor', () => {
    const today = new Date();
    const fifteenAgo = new Date(
      today.getFullYear() - 15,
      today.getMonth(),
      today.getDate(),
    );
    expect(validateBirthday(fifteenAgo)).not.toEqual([]);
  });

  it('should reject an invalid date string', () => {
    expect(validateBirthday('not-a-date')).not.toEqual([]);
  });

  it('should reject a non-string / non-Date value', () => {
    expect(validateBirthday(1990 as unknown as string)).not.toEqual([]);
  });

  it('should reject an empty string', () => {
    expect(validateBirthday('')).not.toEqual([]);
  });

  it('should expose a default error message mentioning the age', () => {
    const errors = validateBirthday('2010-01-01');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('at least 18 years old');
  });
});
