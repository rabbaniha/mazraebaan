import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Crockford base32 alphabet used by ULID — excludes I, L, O, U.
 * ULIDs are always exactly 26 characters.
 */
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/i;

/**
 * Property decorator: validates that a string value is a well-formed ULID
 * (26 chars, Crockford base32). Used for all ID fields — both primary keys and
 * cross-service references — so malformed IDs fail at the API boundary.
 */
export function IsUlid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUlid',
      target: object.constructor,
      propertyName,
      options: {
        message: validationOptions?.message ?? `${propertyName} must be a valid ULID`,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          return ULID_PATTERN.test(value);
        },
      },
    });
  };
}
