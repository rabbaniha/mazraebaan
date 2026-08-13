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
import { AccountMember } from './account-member.entity';
import { Role } from '../../roles/entities/role.entity';

@Entity('account_member_roles')
export class AccountMemberRole {
  // --- PK: ULID ---

  @PrimaryColumn({ type: 'varchar', length: 26 })
  id!: string;

  // --- Composite unique (enforced at DB level) ---

  @Column({ type: 'varchar', length: 26, name: 'account_member_id' })
  accountMemberId!: string;

  @ManyToOne(() => AccountMember, (member) => member.memberRoles, {
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'account_member_id' })
  accountMember?: AccountMember;

  @Column({ type: 'varchar', length: 26, name: 'role_id' })
  roleId!: string;

  @ManyToOne(() => Role, { eager: false })
  @JoinColumn({ name: 'role_id' })
  role?: Role;

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
