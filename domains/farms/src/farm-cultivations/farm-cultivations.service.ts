import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { FarmCultivation } from './entities/farm-cultivation.entity';
import { CreateFarmCultivationDto } from './dto/create-farm-cultivation.dto';
import { UpdateFarmCultivationDto } from './dto/update-farm-cultivation.dto';
import {
  CropTypeSummaryDto,
  FarmCultivationResponseDto,
} from './dto/farm-cultivation-response.dto';
import { CropType } from '../crop-types/entities/crop-type.entity';
import { FarmSeason } from '../farm-seasons/entities/farm-season.entity';
import { FarmPlot } from '../farm-plots/entities/farm-plot.entity';
import type { CultivationStatus } from '../common/enums';

const TRANSITIONS: Record<CultivationStatus, readonly CultivationStatus[]> = {
  planned: ['active', 'failed'],
  active: ['harvested', 'failed'],
  harvested: [],
  failed: [],
};

@Injectable()
export class FarmCultivationsService {
  constructor(
    @InjectRepository(FarmCultivation)
    private readonly cultivationRepo: Repository<FarmCultivation>,
    @InjectRepository(CropType)
    private readonly cropTypeRepo: Repository<CropType>,
    @InjectRepository(FarmSeason)
    private readonly seasonRepo: Repository<FarmSeason>,
    @InjectRepository(FarmPlot)
    private readonly plotRepo: Repository<FarmPlot>,
  ) {}

  async create(
    farmId: string,
    dto: CreateFarmCultivationDto,
    userId: string,
  ): Promise<FarmCultivationResponseDto> {
    await this.validateCropType(dto.crop_type_id);
    if (dto.farm_season_id) await this.assertSeasonBelongsToFarm(dto.farm_season_id, farmId);
    if (dto.farm_plot_id) await this.assertPlotBelongsToFarm(dto.farm_plot_id, farmId);

    const cultivation = this.cultivationRepo.create({
      farmId,
      farmSeasonId: dto.farm_season_id ?? null,
      farmPlotId: dto.farm_plot_id ?? null,
      cropTypeId: dto.crop_type_id,
      cultivationMode: dto.cultivation_mode,
      sowingDate: dto.sowing_date ?? null,
      transplantDate: dto.transplant_date ?? null,
      harvestDate: dto.harvest_date ?? null,
      expectedHarvestDate: dto.expected_harvest_date ?? null,
      notes: dto.notes ?? null,
      createdByUserId: userId,
      status: dto.status ?? 'planned',
    });

    const saved = await this.cultivationRepo.save(cultivation);
    return this.toDto(saved);
  }

  async findAll(farmId: string): Promise<FarmCultivationResponseDto[]> {
    const cultivations = await this.cultivationRepo.find({
      where: { farmId },
      order: { createdAt: 'DESC' },
    });
    return this.toDtos(cultivations);
  }

  async findOne(farmId: string, id: string): Promise<FarmCultivationResponseDto> {
    const cultivation = await this.cultivationRepo.findOne({ where: { id, farmId } });
    if (!cultivation) throw new NotFoundException('CULTIVATION_NOT_FOUND');
    return this.toDto(cultivation);
  }

  async update(
    farmId: string,
    id: string,
    dto: UpdateFarmCultivationDto,
  ): Promise<FarmCultivationResponseDto> {
    const cultivation = await this.cultivationRepo.findOne({ where: { id, farmId } });
    if (!cultivation) throw new NotFoundException('CULTIVATION_NOT_FOUND');

    if (dto.farm_season_id !== undefined) {
      if (dto.farm_season_id !== null) {
        await this.assertSeasonBelongsToFarm(dto.farm_season_id, farmId);
      }
      cultivation.farmSeasonId = dto.farm_season_id;
    }
    if (dto.farm_plot_id !== undefined) {
      if (dto.farm_plot_id !== null) {
        await this.assertPlotBelongsToFarm(dto.farm_plot_id, farmId);
      }
      cultivation.farmPlotId = dto.farm_plot_id;
    }
    if (dto.cultivation_mode !== undefined) cultivation.cultivationMode = dto.cultivation_mode;
    if (dto.sowing_date !== undefined) cultivation.sowingDate = dto.sowing_date;
    if (dto.transplant_date !== undefined) cultivation.transplantDate = dto.transplant_date;
    if (dto.harvest_date !== undefined) cultivation.harvestDate = dto.harvest_date;
    if (dto.expected_harvest_date !== undefined) {
      cultivation.expectedHarvestDate = dto.expected_harvest_date;
    }
    if (dto.notes !== undefined) cultivation.notes = dto.notes;

    if (dto.status !== undefined && dto.status !== cultivation.status) {
      const allowed = TRANSITIONS[cultivation.status];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `CULTIVATION_INVALID_TRANSITION: cannot move from ${cultivation.status} to ${dto.status}`,
        );
      }
      cultivation.status = dto.status;
    }

    const saved = await this.cultivationRepo.save(cultivation);
    return this.toDto(saved);
  }

  async remove(farmId: string, id: string): Promise<void> {
    const cultivation = await this.cultivationRepo.findOne({ where: { id, farmId } });
    if (!cultivation) throw new NotFoundException('CULTIVATION_NOT_FOUND');
    await this.cultivationRepo.remove(cultivation);
  }

  // --- mapping + validation helpers -----------------------------------------

  private async toDtos(
    cultivations: FarmCultivation[],
  ): Promise<FarmCultivationResponseDto[]> {
    const cropTypeIds = [...new Set(cultivations.map((c) => c.cropTypeId))];
    const cropTypes = await this.cropTypeRepo.find({ where: { id: In(cropTypeIds) } });
    const map = new Map(cropTypes.map((c) => [c.id, c]));
    return cultivations.map((c) => this.toDto(c, map.get(c.cropTypeId)));
  }

  private toDto(
    c: FarmCultivation,
    cropType?: CropType,
  ): FarmCultivationResponseDto {
    const dto = new FarmCultivationResponseDto();
    dto.id = c.id;
    dto.farm_id = c.farmId;
    dto.farm_season_id = c.farmSeasonId;
    dto.farm_plot_id = c.farmPlotId;
    dto.crop_type_id = c.cropTypeId;
    dto.crop_type = cropType ? this.toCropSummary(cropType) : null;
    dto.cultivation_mode = c.cultivationMode;
    dto.sowing_date = c.sowingDate;
    dto.transplant_date = c.transplantDate;
    dto.harvest_date = c.harvestDate;
    dto.expected_harvest_date = c.expectedHarvestDate;
    dto.status = c.status;
    dto.notes = c.notes;
    dto.created_by_user_id = c.createdByUserId;
    dto.created_at = c.createdAt;
    dto.updated_at = c.updatedAt;
    return dto;
  }

  private toCropSummary(crop: CropType): CropTypeSummaryDto {
    const s = new CropTypeSummaryDto();
    s.id = crop.id;
    s.code = crop.code;
    s.name_fa = crop.nameFa;
    s.name_en = crop.nameEn;
    return s;
  }

  private async validateCropType(cropTypeId: string): Promise<void> {
    const crop = await this.cropTypeRepo.findOne({ where: { id: cropTypeId } });
    if (!crop) throw new NotFoundException('CROP_TYPE_NOT_FOUND');
    if (!crop.isActive) {
      throw new BadRequestException('CROP_TYPE_INACTIVE');
    }
  }

  private async assertSeasonBelongsToFarm(seasonId: string, farmId: string): Promise<void> {
    const season = await this.seasonRepo.findOne({ where: { id: seasonId, farmId } });
    if (!season) throw new NotFoundException('SEASON_NOT_FOUND_FOR_FARM');
  }

  private async assertPlotBelongsToFarm(plotId: string, farmId: string): Promise<void> {
    const plot = await this.plotRepo.findOne({ where: { id: plotId, farmId } });
    if (!plot) throw new NotFoundException('PLOT_NOT_FOUND_FOR_FARM');
  }
}
