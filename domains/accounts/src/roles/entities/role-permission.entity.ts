import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { ulid } from 'ulid';
import { Role } from './role.entity';
import { Permission } from '../../permissions/entities/permission.entity';

@Entity('role_permissions')
export class RolePermission {
  // --- PK: ULID ---

  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  // --- Relationships ---

  @Column({ type: 'varchar', length: 26, name: 'role_id' })
  roleId!: string;

  @ManyToOne(() => Role, (role) => role.rolePermissions, {
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role?: Role;

  @Column({ type: 'varchar', length: 26, name: 'permission_id' })
  permissionId!: string;

  @ManyToOne(() => Permission, { eager: false })
  @JoinColumn({ name: 'permission_id' })
  permission?: Permission;

  // --- Audit ---

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  // --- Lifecycle ---

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = ulid();
    }
  }
}
