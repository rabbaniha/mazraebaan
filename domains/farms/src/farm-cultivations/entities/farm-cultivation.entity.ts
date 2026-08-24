import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { ulid } from 'ulid';
import type { CultivationMode, CultivationStatus } from '../../common/enums';

/**
 * A crop grown on a farm (or a specific plot) within an optional season.
 *
 * Plot-aware but NOT polymorphic: `farm_plot_id` is a plain nullable FK.
 * `NULL` means a farm-level cultivation; a value pins it to an internal plot.
 */
@Entity('farm_cultivations')
export class FarmCultivation {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  @Column({ type: 'varchar', length: 26, name: 'farm_id' })
  farmId!: string;

  @Column({ type: 'varchar', length: 26, name: 'farm_season_id', nullable: true })
  farmSeasonId!: string | null;

  @Column({ type: 'varchar', length: 26, name: 'farm_plot_id', nullable: true })
  farmPlotId!: string | null;

  @Column({ type: 'varchar', length: 26, name: 'crop_type_id' })
  cropTypeId!: string;

  @Column({ type: 'varchar', length: 20, name: 'cultivation_mode' })
  cultivationMode!: CultivationMode;

  @Column({ type: 'date', name: 'sowing_date', nullable: true })
  sowingDate!: string | null;

  @Column({ type: 'date', name: 'transplant_date', nullable: true })
  transplantDate!: string | null;

  @Column({ type: 'date', name: 'harvest_date', nullable: true })
  harvestDate!: string | null;

  @Column({ type: 'date', name: 'expected_harvest_date', nullable: true })
  expectedHarvestDate!: string | null;

  @Column({ type: 'varchar', length: 20, name: 'status', default: 'planned' })
  status!: CultivationStatus;

  @Column({ type: 'text', name: 'notes', nullable: true })
  notes!: string | null;

  // External reference (identity-service) — no DB FK.
  @Column({ type: 'varchar', length: 26, name: 'created_by_user_id' })
  createdByUserId!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @BeforeInsert()
  generateId(): void {
    if (!this.id) this.id = ulid();
  }
}
