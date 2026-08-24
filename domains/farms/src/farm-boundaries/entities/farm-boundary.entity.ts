import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { ulid } from 'ulid';
import type { BoundarySource } from '../../common/enums';
import type {
  GeoJsonMultiPolygon,
  GeoJsonPoint,
  GeoJsonPolygon,
} from '../../common/geometry/geo-json.types';
import { numericTransformer } from '../../common/transformers/numeric.transformer';

/**
 * Immutable, versioned farm boundary geometry.
 *
 * There is NO `is_current` flag — `farms.current_boundary_id` is the single
 * source of truth. "Open" (current) means `valid_to IS NULL`. Geometry is
 * immutable after creation; only `change_reason` and `approved_by_user_id`
 * may be corrected administratively.
 */
@Entity('farm_boundaries')
export class FarmBoundary {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  @Column({ type: 'varchar', length: 26, name: 'farm_id' })
  farmId!: string;

  @Column({ type: 'int', name: 'version_no' })
  versionNo!: number;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'MultiPolygon',
    srid: 4326,
    name: 'geometry',
    select: false,
  })
  geometry!: GeoJsonMultiPolygon;

  @Column({ type: 'varchar', length: 30, name: 'boundary_source' })
  boundarySource!: BoundarySource;

  @Column({
    type: 'numeric',
    name: 'area_m2',
    transformer: numericTransformer,
  })
  areaM2!: number;

  @Column({
    type: 'numeric',
    name: 'area_ha',
    transformer: numericTransformer,
  })
  areaHa!: number;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    name: 'centroid_geom',
    select: false,
  })
  centroidGeom!: GeoJsonPoint;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    name: 'bbox_geom',
    select: false,
  })
  bboxGeom!: GeoJsonPolygon;

  @Column({ type: 'timestamptz', name: 'valid_from' })
  validFrom!: Date;

  @Column({ type: 'timestamptz', name: 'valid_to', nullable: true })
  validTo!: Date | null;

  @Column({ type: 'text', name: 'change_reason', nullable: true })
  changeReason!: string | null;

  // External reference (identity-service) — no DB FK.
  @Column({ type: 'varchar', length: 26, name: 'created_by_user_id' })
  createdByUserId!: string;

  // External reference (identity-service) — no DB FK.
  @Column({
    type: 'varchar',
    length: 26,
    name: 'approved_by_user_id',
    nullable: true,
  })
  approvedByUserId!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @BeforeInsert()
  generateId(): void {
    if (!this.id) this.id = ulid();
  }
}
