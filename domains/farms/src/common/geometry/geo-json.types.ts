/**
 * Minimal GeoJSON (RFC 7946) type definitions for the Farm Service.
 *
 * These are the API-level geometry representations. The persistence layer stores
 * PostGIS `geometry` (EWKB) columns; geometry is translated GeoJSON <-> EWKB at
 * the service boundary via `ST_GeomFromGeoJSON` / `ST_AsGeoJSON`. No external
 * `@types/geojson` dependency is required.
 */

/** A single [longitude, latitude] coordinate (WGS84). */
export type Position = [number, number];

/** A closed ring of positions. */
export type LinearRing = Position[];

/** A Polygon = one or more rings (first is exterior, rest are holes). */
export type PolygonCoordinates = LinearRing[];

/** A MultiPolygon = one or more polygons. */
export type MultiPolygonCoordinates = PolygonCoordinates[];

export interface GeoJsonPoint {
  type: 'Point';
  coordinates: Position;
}

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: PolygonCoordinates;
}

export interface GeoJsonMultiPolygon {
  type: 'MultiPolygon';
  coordinates: MultiPolygonCoordinates;
}

/** Any GeoJSON geometry type emitted by the Farm Service API. */
export type GeoJsonGeometry = GeoJsonPoint | GeoJsonPolygon | GeoJsonMultiPolygon;
