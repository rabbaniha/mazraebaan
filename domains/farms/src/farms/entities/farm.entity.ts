import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BeforeInsert,
} from 'typeorm';
import { ulid } from 'ulid';
import type { FarmStatus } from '../../common/enums';
import type { GeoJsonPoint, GeoJsonPolygon } from '../../common/geometry/geo-json.types';
import { numericTransformer } from '../../common/transformers/numeric.transformer';

/**
 * Logical identity + lifecycle of a farm.
 *
 * Holds NO boundary geometry — only `current_boundary_id` (the single source of
 * truth for the current boundary) plus denormalized spatial snapshots derived
 * from that boundary. `centroid_geom`/`bbox_geom` are `select:false` geometry
 * columns fetched via `ST_AsGeoJSON` where needed.
 */
@Entity('farms')
export class Farm {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  // External reference (accounts-service) — no DB FK.
  @Column({ type: 'varchar', length: 26, name: 'account_id' })
  accountId!: string;

  @Column({ type: 'varchar', length: 50, name: 'code', nullable: true })
  code!: string | null;

  @Column({ type: 'varchar', length: 200, name: 'name' })
  name!: string;

  @Column({ type: 'text', name: 'description', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 20, name: 'status', default: 'draft' })
  status!: FarmStatus;

  // External reference (identity-service) — no DB FK.
  @Column({
    type: 'varchar',
    length: 26,
    name: 'primary_manager_user_id',
    nullable: true,
  })
  primaryManagerUserId!: string | null;

  // External reference (identity-service) — no DB FK.
  @Column({ type: 'varchar', length: 26, name: 'created_by_user_id' })
  createdByUserId!: string;

  @Column({ type: 'char', length: 2, name: 'country_code', default: 'IR' })
  countryCode!: string;

  @Column({ type: 'varchar', length: 100, name: 'state_province' })
  stateProvince!: string;

  @Column({ type: 'varchar', length: 100, name: 'county' })
  county!: string;

  @Column({ type: 'varchar', length: 100, name: 'district' })
  district!: string;

  @Column({ type: 'varchar', length: 100, name: 'village', nullable: true })
  village!: string | null;

  @Column({ type: 'varchar', length: 50, name: 'timezone', default: 'Asia/Tehran' })
  timezone!: string;

  // FK -> farm_boundaries.id (within-service, deferred). Single source of truth.
  @Column({ type: 'varchar', length: 26, name: 'current_boundary_id', nullable: true })
  currentBoundaryId!: string | null;

  // --- Denormalized spatial snapshots (derived, never client-writable) ---

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    name: 'centroid_geom',
    nullable: true,
    select: false,
  })
  centroidGeom!: GeoJsonPoint | null;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    name: 'bbox_geom',
    nullable: true,
    select: false,
  })
  bboxGeom!: GeoJsonPolygon | null;

  @Column({
    type: 'numeric',
    name: 'current_area_m2',
    nullable: true,
    transformer: numericTransformer,
  })
  currentAreaM2!: number | null;

  @Column({
    type: 'numeric',
    name: 'current_area_ha',
    nullable: true,
    transformer: numericTransformer,
  })
  currentAreaHa!: number | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt!: Date | null;

  @Column({ type: 'timestamptz', name: 'purge_after', nullable: true })
  purgeAfter!: Date | null;

  @BeforeInsert()
  generateId(): void {
    if (!this.id) this.id = ulid();
  }
}
