import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import type { GeoJsonMultiPolygon } from '../geometry/geo-json.types';

/**
 * Property decorator: validates that a value is a structurally valid GeoJSON
 * `MultiPolygon` (RFC 7946) with WGS84 coordinates.
 *
 * Checks:
 *   - `type === 'MultiPolygon'`
 *   - coordinates is an array of polygons, each polygon has >= 1 ring,
 *     each ring has >= 4 positions, each position is `[lon, lat]`
 *   - longitude in [-180, 180], latitude in [-90, 90]
 *
 * Note: full topological validity (`ST_IsValid`) is checked server-side at
 * persistence time; this decorator validates shape + coordinate ranges only.
 */
export function IsGeoJsonMultiPolygon(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isGeoJsonMultiPolygon',
      target: object.constructor,
      propertyName,
      options: {
        message:
          validationOptions?.message ??
          `${propertyName} must be a valid GeoJSON MultiPolygon`,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          return isValidMultiPolygon(value);
        },
      },
    });
  };
}

function isValidMultiPolygon(value: unknown): value is GeoJsonMultiPolygon {
  if (typeof value !== 'object' || value === null) return false;
  const geom = value as Record<string, unknown>;
  if (geom.type !== 'MultiPolygon') return false;
  const coords = geom.coordinates;
  if (!Array.isArray(coords) || coords.length === 0) return false;

  return coords.every(
    (polygon) =>
      Array.isArray(polygon) &&
      polygon.length >= 1 &&
      polygon.every(
        (ring) =>
          Array.isArray(ring) &&
          ring.length >= 4 &&
          ring.every((pos) => isValidPosition(pos)),
      ),
  );
}

function isValidPosition(pos: unknown): pos is [number, number] {
  if (!Array.isArray(pos) || pos.length < 2) return false;
  const [lon, lat] = pos as number[];
  if (typeof lon !== 'number' || typeof lat !== 'number') return false;
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return false;
  return lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90;
}
