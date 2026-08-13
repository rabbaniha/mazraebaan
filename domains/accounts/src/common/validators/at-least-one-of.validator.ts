import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Class-level decorator: validates that at least one of the listed properties
 * is defined and non-empty in the DTO.
 *
 * Usage:
 *   @AtLeastOneOf(['email', 'phoneNumber'], { message: '...' })
 *   export class CreateUserDto { ... }
 */
export function AtLeastOneOf(
  propertyNames: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: new (...args: any[]) => any) {
    registerDecorator({
      name: 'atLeastOneOf',
      target: object,
      propertyName: '',
      options: {
        message:
          validationOptions?.message ??
          `At least one of ${propertyNames.join(', ')} must be provided`,
        ...validationOptions,
      },
      constraints: [propertyNames],
      validator: {
        validate(_value: any, args: ValidationArguments) {
          const [fields] = args.constraints as [string[]];
          const dto = args.object as Record<string, unknown>;
          return fields.some(
            (field) =>
              dto[field] !== undefined &&
              dto[field] !== null &&
              dto[field] !== '',
          );
        },
      },
    });
  };
}
