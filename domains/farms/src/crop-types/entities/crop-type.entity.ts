import {
  Entity,
  PrimaryColumn,
  Column,
  BeforeInsert,
} from 'typeorm';
import { ulid } from 'ulid';

/**
 * Reference/master data for crop types, owned by the Farm Service and seeded
 * via migration. `is_active=false` blocks NEW cultivations but never
 * invalidates historical cultivations (which store `crop_type_id`).
 */
@Entity('crop_types')
export class CropType {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  @Column({ type: 'varchar', length: 50, name: 'code' })
  code!: string;

  @Column({ type: 'varchar', length: 100, name: 'name_fa' })
  nameFa!: string;

  @Column({ type: 'varchar', length: 100, name: 'name_en' })
  nameEn!: string;

  @Column({ type: 'varchar', length: 150, name: 'scientific_name', nullable: true })
  scientificName!: string | null;

  @Column({ type: 'varchar', length: 100, name: 'category', nullable: true })
  category!: string | null;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @BeforeInsert()
  generateId(): void {
    if (!this.id) this.id = ulid();
  }
}
