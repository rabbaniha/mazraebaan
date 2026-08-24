import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { ulid } from 'ulid';
import type { GeoJsonMultiPolygon } from '../../common/geometry/geo-json.types';
import { numericTransformer } from '../../common/transformers/numeric.transformer';

/**
 * An internal subdivision of a farm. Plots are OPTIONAL — a farm may have
 * zero plots. Each plot is pinned to a specific boundary version via
 * `farm_boundary_id`, so plot geometry is always anchored to an immutable
 * boundary snapshot.
 */
@Entity('farm_plots')
export class FarmPlot {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  @Column({ type: 'varchar', length: 26, name: 'farm_id' })
  farmId!: string;

  @Column({ type: 'varchar', length: 26, name: 'farm_boundary_id' })
  farmBoundaryId!: string;

  @Column({ type: 'varchar', length: 100, name: 'name' })
  name!: string;

  @Column({ type: 'varchar', length: 50, name: 'code', nullable: true })
  code!: string | null;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'MultiPolygon',
    srid: 4326,
    name: 'geometry',
    select: false,
  })
  geometry!: GeoJsonMultiPolygon;

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

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @BeforeInsert()
  generateId(): void {
    if (!this.id) this.id = ulid();
  }
}
