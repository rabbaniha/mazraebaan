import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Class-level decorator: validates that the `startField` date is strictly
 * before (or equal to) the `endField` date.
 *
 * Usage:
 *   @IsStartBeforeEnd('startDate', 'endDate', { allowEqual: true })
 *   export class CreateFarmSeasonDto { ... }
 *
 * When `allowEqual` is true, `startField <= endField` is accepted.
 */
export function IsStartBeforeEnd(
  startField: string,
  endField: string,
  options?: ValidationOptions & { allowEqual?: boolean },
) {
  const allowEqual = options?.allowEqual ?? false;
  return function (object: new (...args: never[]) => unknown) {
    registerDecorator({
      name: 'isStartBeforeEnd',
      target: object,
      propertyName: '',
      options: {
        message:
          options?.message ??
          `${startField} must be ${allowEqual ? 'before or equal to' : 'before'} ${endField}`,
        ...options,
      },
      constraints: [startField, endField, allowEqual],
      validator: {
        validate(_value: unknown, args: ValidationArguments) {
          const [start, end, equal] = args.constraints as [
            string,
            string,
            boolean,
          ];
          const dto = args.object as Record<string, unknown>;
          const startVal = dto[start];
          const endVal = dto[end];
          // Presence/format are handled by @IsDateString / @IsDate on each field.
          if (startVal === undefined || startVal === null || startVal === '') {
            return true;
          }
          if (endVal === undefined || endVal === null || endVal === '') {
            return true;
          }
          const a = new Date(startVal as string).getTime();
          const b = new Date(endVal as string).getTime();
          return equal ? a <= b : a < b;
        },
      },
    });
  };
}
