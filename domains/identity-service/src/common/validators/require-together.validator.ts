import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Class-level decorator: when any of the listed properties is provided,
 * ALL listed properties must be present.
 *
 * Usage:
 *   @RequireTogether(['phoneNumber', 'phoneCountryCode'], { message: '...' })
 *   export class CreateUserDto { ... }
 */
export function RequireTogether(
  propertyNames: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: new (...args: any[]) => any) {
    registerDecorator({
      name: 'requireTogether',
      target: object,
      propertyName: '',
      options: {
        message:
          validationOptions?.message ??
          `All fields must be provided together: ${propertyNames.join(', ')}`,
        ...validationOptions,
      },
      constraints: [propertyNames],
      validator: {
        validate(_value: any, args: ValidationArguments) {
          const [fields] = args.constraints as [string[]];
          const dto = args.object as Record<string, unknown>;
          const present = fields.filter(
            (f) => dto[f] !== undefined && dto[f] !== null && dto[f] !== '',
          );
          // Either all present or none present
          return present.length === 0 || present.length === fields.length;
        },
      },
    });
  };
}
