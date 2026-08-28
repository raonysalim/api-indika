import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsCpf(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isCpf',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          // If value is undefined, null, or empty string, skip validation (optional field)
          if (value === undefined || value === null || value === '') {
            return true;
          }
          if (typeof value !== 'string') return false;
          const cleanCpf = value.replace(/[^\d]/g, '');

          // Validações básicas
          if (cleanCpf.length !== 11) return false;
          if (/^(\d)\1{10}$/.test(cleanCpf)) return false; // 111.111.111-11 etc.

          // Algoritmo do CPF (dígitos verificadores)
          let sum = 0;
          let remainder: number;

          for (let i = 1; i <= 9; i++)
            sum += parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
          remainder = (sum * 10) % 11;

          if (remainder === 10 || remainder === 11) remainder = 0;
          if (remainder !== parseInt(cleanCpf.substring(9, 10))) return false;

          sum = 0;
          for (let i = 1; i <= 10; i++)
            sum += parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
          remainder = (sum * 10) % 11;

          if (remainder === 10 || remainder === 11) remainder = 0;
          return remainder === parseInt(cleanCpf.substring(10, 11));
        },
        defaultMessage() {
          return 'Invalid CPF format';
        },
      },
    });
  };
}
