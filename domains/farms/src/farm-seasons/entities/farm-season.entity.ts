import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { ulid } from 'ulid';
import type { SeasonStatus, SeasonType } from '../../common/enums';

/**
 * A growing season / crop year — a first-class domain concept. Future analyses,
 * cultivations, recommendations and irrigation activities reference a season.
 */
@Entity('farm_seasons')
export class FarmSeason {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  @Column({ type: 'varchar', length: 26, name: 'farm_id' })
  farmId!: string;

  @Column({ type: 'varchar', length: 100, name: 'name' })
  name!: string;

  @Column({ type: 'smallint', name: 'crop_year' })
  cropYear!: number;

  @Column({ type: 'varchar', length: 20, name: 'season_type' })
  seasonType!: SeasonType;

  @Column({ type: 'date', name: 'start_date' })
  startDate!: string;

  @Column({ type: 'date', name: 'end_date', nullable: true })
  endDate!: string | null;

  @Column({ type: 'varchar', length: 20, name: 'status', default: 'planned' })
  status!: SeasonStatus;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @BeforeInsert()
  generateId(): void {
    if (!this.id) this.id = ulid();
  }
}
