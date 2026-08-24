/**
 * Shared enum value lists + TypeScript union types for the Farm Service.
 *
 * Persisted as `VARCHAR + CHECK` (ADR-005 — never native Postgres ENUM). The
 * `as const` arrays are reused by `@IsIn(...)` in DTOs so the API validation
 * and the entity types can never drift apart.
 */

export const FARM_STATUSES = ['draft', 'active', 'archived', 'deleted'] as const;
export type FarmStatus = (typeof FARM_STATUSES)[number];

export const BOUNDARY_SOURCES = [
  'user_drawn',
  'uploaded_geojson',
  'uploaded_kml',
  'admin_corrected',
  'imported',
] as const;
export type BoundarySource = (typeof BOUNDARY_SOURCES)[number];

export const BOUNDARY_CHANGE_TYPES = [
  'create',
  'replace',
  'adjust',
  'restore_old',
] as const;
export type BoundaryChangeType = (typeof BOUNDARY_CHANGE_TYPES)[number];

export const SEASON_TYPES = [
  'spring',
  'summer',
  'autumn',
  'winter',
  'custom',
] as const;
export type SeasonType = (typeof SEASON_TYPES)[number];

export const SEASON_STATUSES = [
  'planned',
  'active',
  'completed',
  'canceled',
] as const;
export type SeasonStatus = (typeof SEASON_STATUSES)[number];

export const CULTIVATION_MODES = [
  'irrigated',
  'rainfed',
  'greenhouse',
  'orchard',
  'open_field',
] as const;
export type CultivationMode = (typeof CULTIVATION_MODES)[number];

export const CULTIVATION_STATUSES = [
  'planned',
  'active',
  'harvested',
  'failed',
] as const;
export type CultivationStatus = (typeof CULTIVATION_STATUSES)[number];

export const ACCESS_ROLES = [
  'manager',
  'editor',
  'viewer',
  'advisor',
] as const;
export type AccessRole = (typeof ACCESS_ROLES)[number];
