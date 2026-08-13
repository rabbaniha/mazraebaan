import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

  async create(dto: CreateRoleDto): Promise<Role> {
    const role = this.roleRepo.create({
      name: dto.name,
      isSystem: dto.isSystem ?? false,
      description: dto.description ?? null,
    });
    const saved = await this.roleRepo.save(role);

    if (dto.permissionIds?.length) {
      const assignments = dto.permissionIds.map((permissionId) =>
        this.rolePermissionRepo.create({
          roleId: saved.id,
          permissionId,
        }),
      );
      await this.rolePermissionRepo.save(assignments);
    }

    return saved;
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepo.find();
  }

  async findOne(id: string): Promise<Role | null> {
    return this.roleRepo.findOne({ where: { id } });
  }

  /**
   * Resolve multiple roles by id (used for ownership detection in /me).
   */
  async findByIds(ids: string[]): Promise<Role[]> {
    if (ids.length === 0) return [];
    return this.roleRepo.find({
      where: ids.map((id) => ({ id })),
    });
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role | null> {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) return null;

    if (dto.name !== undefined) role.name = dto.name;
    if (dto.description !== undefined) role.description = dto.description;

    await this.roleRepo.save(role);

    if (dto.permissionIds !== undefined) {
      await this.rolePermissionRepo.delete({ roleId: id });
      if (dto.permissionIds.length) {
        const assignments = dto.permissionIds.map((permissionId) =>
          this.rolePermissionRepo.create({
            roleId: id,
            permissionId,
          }),
        );
        await this.rolePermissionRepo.save(assignments);
      }
    }

    return role;
  }

  async remove(id: string): Promise<boolean> {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) return false;

    if (role.isSystem) {
      throw new Error('Cannot delete a system role');
    }

    await this.rolePermissionRepo.delete({ roleId: id });
    await this.roleRepo.remove(role);
    return true;
  }
}
