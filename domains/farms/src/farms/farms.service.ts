import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Farm } from './entities/farm.entity';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { ChangeFarmStatusDto } from './dto/change-farm-status.dto';
import { FarmResponseDto } from './dto/farm-response.dto';
import { FarmSummaryDto } from './dto/farm-summary.dto';
import type { FarmStatus } from '../common/enums';

/** Farm lifecycle transition graph. `draft` is never a target (no transition ends there). */
const TRANSITIONS: Record<FarmStatus, readonly FarmStatus[]> = {
  draft: ['active', 'archived', 'deleted'],
  active: ['archived', 'deleted'],
  archived: ['active', 'deleted'],
  deleted: ['archived'],
};

/** How long a deleted farm is retained before the purge job hard-deletes it. */
const PURGE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

interface FarmRawRow {
  f_id: string;
  f_account_id: string;
  f_code: string | null;
  f_name: string;
  f_description: string | null;
  f_status: FarmStatus;
  f_primary_manager_user_id: string | null;
  f_country_code: string;
  f_state_province: string;
  f_county: string;
  f_district: string;
  f_village: string | null;
  f_timezone: string;
  f_current_boundary_id: string | null;
  f_current_area_m2: string | null;
  f_current_area_ha: string | null;
  f_created_at: Date;
  f_updated_at: Date;
  f_deleted_at: Date | null;
  f_purge_after: Date | null;
  centroid_geo?: unknown;
  bbox_geo?: unknown;
}

@Injectable()
export class FarmsService {
  constructor(
    @InjectRepository(Farm)
    private readonly farmRepo: Repository<Farm>,
  ) {}

  async create(
    dto: CreateFarmDto,
    accountId: string,
    userId: string,
  ): Promise<FarmSummaryDto> {
    const farm = this.farmRepo.create({
      accountId,
      code: dto.code ?? null,
      name: dto.name,
      description: dto.description ?? null,
      countryCode: dto.country_code ?? 'IR',
      stateProvince: dto.state_province,
      county: dto.county,
      district: dto.district,
      village: dto.village ?? null,
      timezone: dto.timezone ?? 'Asia/Tehran',
      primaryManagerUserId: dto.primary_manager_user_id ?? null,
      createdByUserId: userId,
      status: 'draft',
    });
    const saved = await this.farmRepo.save(farm);
    return this.summaryFromEntity(saved);
  }

  async findAll(accountId: string): Promise<FarmSummaryDto[]> {
    const rows = await this.farmRepo
      .createQueryBuilder('f')
      .addSelect('ST_AsGeoJSON(f.centroid_geom)::json', 'centroid_geo')
      .where('f.account_id = :accountId', { accountId })
      .andWhere('f.deleted_at IS NULL')
      .orderBy('f.created_at', 'DESC')
      .getRawMany();

    return rows.map((r) => this.summaryFromRaw(r as unknown as FarmRawRow));
  }

  async findOne(id: string): Promise<FarmResponseDto> {
    const row = await this.farmRepo
      .createQueryBuilder('f')
      .addSelect('ST_AsGeoJSON(f.centroid_geom)::json', 'centroid_geo')
      .addSelect('ST_AsGeoJSON(f.bbox_geom)::json', 'bbox_geo')
      .where('f.id = :id', { id })
      .getRawOne();

    if (!row) throw new NotFoundException('FARM_NOT_FOUND');
    return this.responseFromRaw(row as unknown as FarmRawRow);
  }

  async update(id: string, dto: UpdateFarmDto): Promise<FarmResponseDto> {
    const farm = await this.farmRepo.findOne({ where: { id } });
    if (!farm) throw new NotFoundException('FARM_NOT_FOUND');
    if (farm.status === 'deleted') {
      throw new BadRequestException('FARM_DELETED');
    }

    if (dto.name !== undefined) farm.name = dto.name;
    if (dto.code !== undefined) farm.code = dto.code;
    if (dto.description !== undefined) farm.description = dto.description;
    if (dto.country_code !== undefined) farm.countryCode = dto.country_code;
    if (dto.state_province !== undefined) farm.stateProvince = dto.state_province;
    if (dto.county !== undefined) farm.county = dto.county;
    if (dto.district !== undefined) farm.district = dto.district;
    if (dto.village !== undefined) farm.village = dto.village;
    if (dto.timezone !== undefined) farm.timezone = dto.timezone;
    if (dto.primary_manager_user_id !== undefined) {
      farm.primaryManagerUserId = dto.primary_manager_user_id;
    }

    await this.farmRepo.save(farm);
    return this.findOne(id);
  }

  async changeStatus(id: string, dto: ChangeFarmStatusDto): Promise<FarmResponseDto> {
    const farm = await this.farmRepo.findOne({ where: { id } });
    if (!farm) throw new NotFoundException('FARM_NOT_FOUND');

    const allowed = TRANSITIONS[farm.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `FARM_INVALID_TRANSITION: cannot move from ${farm.status} to ${dto.status}`,
      );
    }

    if (dto.status === 'active' && !farm.currentBoundaryId) {
      throw new BadRequestException('FARM_ACTIVE_REQUIRES_BOUNDARY');
    }

    if (dto.status === 'deleted') {
      farm.deletedAt = new Date();
      farm.purgeAfter = new Date(Date.now() + PURGE_RETENTION_MS);
    } else if (dto.status === 'archived' && farm.status === 'deleted') {
      // restore from deleted
      farm.deletedAt = null;
      farm.purgeAfter = null;
    } else if (dto.status === 'active' && farm.status === 'archived') {
      // restore from archived — no delete metadata to clear
    }

    farm.status = dto.status;
    await this.farmRepo.save(farm);
    return this.findOne(id);
  }

  async remove(id: string): Promise<FarmResponseDto> {
    // DELETE is a soft-delete: full lifecycle transition to `deleted`
    // (sets deleted_at + purge_after), consistent with changeStatus.
    return this.changeStatus(id, { status: 'deleted' });
  }

  /** Whether a farm exists (used by other services for cross-entity checks). */
  async exists(id: string): Promise<boolean> {
    return (await this.farmRepo.count({ where: { id } })) > 0;
  }

  // --- mapping helpers -----------------------------------------------------

  private summaryFromEntity(farm: Farm): FarmSummaryDto {
    const dto = new FarmSummaryDto();
    dto.id = farm.id;
    dto.code = farm.code;
    dto.name = farm.name;
    dto.status = farm.status;
    dto.country_code = farm.countryCode;
    dto.state_province = farm.stateProvince;
    dto.current_area_ha = farm.currentAreaHa;
    dto.current_boundary_id = farm.currentBoundaryId;
    dto.centroid = null;
    dto.created_at = farm.createdAt;
    return dto;
  }

  private summaryFromRaw(r: FarmRawRow): FarmSummaryDto {
    const dto = new FarmSummaryDto();
    dto.id = r.f_id;
    dto.code = r.f_code;
    dto.name = r.f_name;
    dto.status = r.f_status;
    dto.country_code = r.f_country_code;
    dto.state_province = r.f_state_province;
    dto.current_area_ha = r.f_current_area_ha === null ? null : Number(r.f_current_area_ha);
    dto.current_boundary_id = r.f_current_boundary_id;
    dto.centroid = (r.centroid_geo as FarmSummaryDto['centroid']) ?? null;
    dto.created_at = r.f_created_at;
    return dto;
  }

  private responseFromRaw(r: FarmRawRow): FarmResponseDto {
    const dto = new FarmResponseDto();
    dto.id = r.f_id;
    dto.account_id = r.f_account_id;
    dto.code = r.f_code;
    dto.name = r.f_name;
    dto.description = r.f_description;
    dto.status = r.f_status;
    dto.primary_manager_user_id = r.f_primary_manager_user_id;
    dto.country_code = r.f_country_code;
    dto.state_province = r.f_state_province;
    dto.county = r.f_county;
    dto.district = r.f_district;
    dto.village = r.f_village;
    dto.timezone = r.f_timezone;
    dto.current_boundary_id = r.f_current_boundary_id;
    dto.centroid = (r.centroid_geo as FarmResponseDto['centroid']) ?? null;
    dto.bbox = (r.bbox_geo as FarmResponseDto['bbox']) ?? null;
    dto.current_area_m2 = r.f_current_area_m2 === null ? null : Number(r.f_current_area_m2);
    dto.current_area_ha = r.f_current_area_ha === null ? null : Number(r.f_current_area_ha);
    dto.created_at = r.f_created_at;
    dto.updated_at = r.f_updated_at;
    dto.deleted_at = r.f_deleted_at;
    dto.purge_after = r.f_purge_after;
    return dto;
  }
}
