import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { FarmAccessGrant } from './entities/farm-access-grant.entity';
import { GrantFarmAccessDto } from './dto/grant-farm-access.dto';
import { UpdateFarmAccessDto } from './dto/update-farm-access.dto';
import { FarmAccessGrantResponseDto } from './dto/farm-access-grant-response.dto';
import { Farm } from '../farms/entities/farm.entity';

@Injectable()
export class FarmAccessGrantsService {
  constructor(
    @InjectRepository(FarmAccessGrant)
    private readonly grantRepo: Repository<FarmAccessGrant>,
    @InjectRepository(Farm)
    private readonly farmRepo: Repository<Farm>,
    private readonly dataSource: DataSource,
  ) {}

  async grant(
    farmId: string,
    dto: GrantFarmAccessDto,
    grantorUserId: string,
  ): Promise<FarmAccessGrantResponseDto> {
    await this.assertFarmExists(farmId);

    const grant = await this.dataSource.transaction(async (manager) => {
      // Supersede any prior grant for the same (farm, grantee, role) that is
      // still open — including expired-but-not-revoked rows.
      await manager.query(
        `UPDATE farm_access_grants
           SET revoked_at = now()
         WHERE farm_id = $1 AND grantee_user_id = $2 AND access_role = $3
           AND revoked_at IS NULL;`,
        [farmId, dto.grantee_user_id, dto.access_role],
      );

      const entity = manager.create(FarmAccessGrant, {
        farmId,
        granteeUserId: dto.grantee_user_id,
        accessRole: dto.access_role,
        grantedByUserId: grantorUserId,
        grantedAt: new Date(),
        expiresAt: dto.expires_at ? new Date(dto.expires_at) : null,
        revokedAt: null,
      });
      return manager.save(entity);
    });

    return this.toDto(grant);
  }

  async findAll(farmId: string): Promise<FarmAccessGrantResponseDto[]> {
    const grants = await this.grantRepo.find({
      where: { farmId },
      order: { grantedAt: 'DESC' },
    });
    return grants.map((g) => this.toDto(g));
  }

  async findByGrantee(granteeUserId: string): Promise<FarmAccessGrantResponseDto[]> {
    const grants = await this.grantRepo.find({
      where: { granteeUserId, revokedAt: IsNull() },
      order: { grantedAt: 'DESC' },
    });
    return grants.map((g) => this.toDto(g));
  }

  async update(
    farmId: string,
    grantId: string,
    dto: UpdateFarmAccessDto,
  ): Promise<FarmAccessGrantResponseDto> {
    const grant = await this.grantRepo.findOne({ where: { id: grantId, farmId } });
    if (!grant) throw new NotFoundException('GRANT_NOT_FOUND');
    if (grant.revokedAt) throw new ConflictException('GRANT_REVOKED');

    if (dto.access_role !== undefined) grant.accessRole = dto.access_role;
    if (dto.expires_at !== undefined) {
      grant.expiresAt = dto.expires_at ? new Date(dto.expires_at) : null;
    }
    return this.toDto(await this.grantRepo.save(grant));
  }

  async revoke(farmId: string, grantId: string): Promise<FarmAccessGrantResponseDto> {
    const grant = await this.grantRepo.findOne({ where: { id: grantId, farmId } });
    if (!grant) throw new NotFoundException('GRANT_NOT_FOUND');
    if (grant.revokedAt) return this.toDto(grant);
    grant.revokedAt = new Date();
    return this.toDto(await this.grantRepo.save(grant));
  }

  // --- helpers --------------------------------------------------------------

  private async assertFarmExists(farmId: string): Promise<void> {
    const exists = (await this.farmRepo.count({ where: { id: farmId } })) > 0;
    if (!exists) throw new NotFoundException('FARM_NOT_FOUND');
  }

  private toDto(g: FarmAccessGrant): FarmAccessGrantResponseDto {
    const dto = new FarmAccessGrantResponseDto();
    dto.id = g.id;
    dto.farm_id = g.farmId;
    dto.grantee_user_id = g.granteeUserId;
    dto.access_role = g.accessRole;
    dto.granted_by_user_id = g.grantedByUserId;
    dto.granted_at = g.grantedAt;
    dto.expires_at = g.expiresAt;
    dto.revoked_at = g.revokedAt;
    dto.created_at = g.createdAt;
    dto.is_active =
      g.revokedAt === null &&
      (g.expiresAt === null || g.expiresAt.getTime() > Date.now());
    return dto;
  }
}
