import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsOfLegalAge(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isOfLegalAge',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (typeof value !== 'string' && !(value instanceof Date)) {
            return false;
          }

          const date = new Date(value);
          if (isNaN(date.getTime())) {
            return false;
          }

          const today = new Date();
          const eighteenYearsAgo = new Date(
            today.getFullYear() - 18,
            today.getMonth(),
            today.getDate(),
          );

          return date <= eighteenYearsAgo;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} requires user to be at least 18 years old`;
        },
      },
    });
  };
}
