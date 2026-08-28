import { registerDecorator, ValidationOptions } from 'class-validator';

export interface PhoneValidationOptions {
  /** Código do país para validação específica (padrão: 'BR') */
  country?: string;
}

export function IsPhone(
  options: PhoneValidationOptions = {},
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPhone',
      target: object.constructor,
      propertyName: propertyName,
      options: { ...validationOptions, ...options },
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;

          // Remove todos os caracteres não numéricos para validação
          const digitsOnly = value.replace(/\D/g, '');

          // Validação específica por país
          if (digitsOnly.length !== 11) return false;

          const ddd = parseInt(digitsOnly.slice(0, 2), 10);
          const startsWithNine = digitsOnly[2] === '9';

          // DDDs válidos no Brasil: 11 a 99
          // Desde 2016, todos os celulares começam com 9
          return ddd >= 11 && ddd <= 99 && startsWithNine;
        },

        defaultMessage() {
          const examples = ['(11) 99999-9999', '99999-9999', '11999999999'];
          return `Invalid phone number. Accepted formats: ${examples.join(', ')}`;
        },
      },
    });
  };
}
