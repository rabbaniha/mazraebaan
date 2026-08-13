import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import { ulid } from 'ulid';
import { RolePermission } from './role-permission.entity';

@Entity('roles')
export class Role {
  // --- PK: ULID ---

  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  // --- Identity ---

  @Column({ type: 'varchar', length: 50, unique: true, name: 'name' })
  name!: string;

  @Column({ type: 'boolean', name: 'is_system', default: false })
  isSystem!: boolean;

  @Column({ type: 'text', name: 'description', nullable: true })
  description!: string | null;

  // --- Permissions (many-to-many via junction entity) ---

  @OneToMany(() => RolePermission, (rp) => rp.role)
  rolePermissions?: RolePermission[];

  // --- Audit ---

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  // --- Lifecycle ---

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = ulid();
    }
  }
}
