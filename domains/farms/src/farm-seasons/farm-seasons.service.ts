import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FarmSeason } from './entities/farm-season.entity';
import { CreateFarmSeasonDto } from './dto/create-farm-season.dto';
import { UpdateFarmSeasonDto } from './dto/update-farm-season.dto';
import { FarmSeasonResponseDto } from './dto/farm-season-response.dto';
import type { SeasonStatus } from '../common/enums';

const TRANSITIONS: Record<SeasonStatus, readonly SeasonStatus[]> = {
  planned: ['active', 'canceled'],
  active: ['completed', 'canceled'],
  completed: [],
  canceled: [],
};

@Injectable()
export class FarmSeasonsService {
  constructor(
    @InjectRepository(FarmSeason)
    private readonly seasonRepo: Repository<FarmSeason>,
  ) {}

  async create(
    farmId: string,
    dto: CreateFarmSeasonDto,
  ): Promise<FarmSeasonResponseDto> {
    const season = this.seasonRepo.create({
      farmId,
      name: dto.name,
      cropYear: dto.crop_year,
      seasonType: dto.season_type,
      startDate: dto.start_date,
      endDate: dto.end_date ?? null,
      status: dto.status ?? 'planned',
    });
    return this.toDto(await this.seasonRepo.save(season));
  }

  async findAll(farmId: string): Promise<FarmSeasonResponseDto[]> {
    const seasons = await this.seasonRepo.find({
      where: { farmId },
      order: { cropYear: 'DESC', startDate: 'DESC' },
    });
    return seasons.map((s) => this.toDto(s));
  }

  async findOne(farmId: string, id: string): Promise<FarmSeasonResponseDto> {
    const season = await this.seasonRepo.findOne({ where: { id, farmId } });
    if (!season) throw new NotFoundException('SEASON_NOT_FOUND');
    return this.toDto(season);
  }

  async update(
    farmId: string,
    id: string,
    dto: UpdateFarmSeasonDto,
  ): Promise<FarmSeasonResponseDto> {
    const season = await this.seasonRepo.findOne({ where: { id, farmId } });
    if (!season) throw new NotFoundException('SEASON_NOT_FOUND');

    if (dto.name !== undefined) season.name = dto.name;
    if (dto.crop_year !== undefined) season.cropYear = dto.crop_year;
    if (dto.season_type !== undefined) season.seasonType = dto.season_type;
    if (dto.start_date !== undefined) season.startDate = dto.start_date;
    if (dto.end_date !== undefined) season.endDate = dto.end_date;

    if (dto.status !== undefined && dto.status !== season.status) {
      const allowed = TRANSITIONS[season.status];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `SEASON_INVALID_TRANSITION: cannot move from ${season.status} to ${dto.status}`,
        );
      }
      season.status = dto.status;
    }

    return this.toDto(await this.seasonRepo.save(season));
  }

  async remove(farmId: string, id: string): Promise<void> {
    const season = await this.seasonRepo.findOne({ where: { id, farmId } });
    if (!season) throw new NotFoundException('SEASON_NOT_FOUND');
    await this.seasonRepo.remove(season);
  }

  private toDto(season: FarmSeason): FarmSeasonResponseDto {
    const dto = new FarmSeasonResponseDto();
    dto.id = season.id;
    dto.farm_id = season.farmId;
    dto.name = season.name;
    dto.crop_year = season.cropYear;
    dto.season_type = season.seasonType;
    dto.start_date = season.startDate;
    dto.end_date = season.endDate;
    dto.status = season.status;
    dto.created_at = season.createdAt;
    return dto;
  }
}
