import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Class-level decorator: validates that the `startField` date is strictly
 * before the `endField` date.
 *
 * Usage:
 *   @IsStartBeforeEnd('startsAt', 'expiresAt')
 *   export class CreateStaffAccessGrantDto { ... }
 */
export function IsStartBeforeEnd(
  startField: string,
  endField: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: new (...args: any[]) => any) {
    registerDecorator({
      name: 'isStartBeforeEnd',
      target: object,
      propertyName: '',
      options: {
        message:
          validationOptions?.message ??
          `${startField} must be before ${endField}`,
        ...validationOptions,
      },
      constraints: [startField, endField],
      validator: {
        validate(_value: any, args: ValidationArguments) {
          const [start, end] = args.constraints as [string, string];
          const dto = args.object as Record<string, unknown>;
          const startVal = dto[start];
          const endVal = dto[end];
          if (!startVal || !endVal) return true; // let @IsDateString handle presence
          return new Date(startVal as string) < new Date(endVal as string);
        },
      },
    });
  };
}
