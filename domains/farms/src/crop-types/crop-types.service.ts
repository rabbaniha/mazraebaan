import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CropType } from './entities/crop-type.entity';
import { CreateCropTypeDto } from './dto/create-crop-type.dto';
import { UpdateCropTypeDto } from './dto/update-crop-type.dto';
import { CropTypeResponseDto } from './dto/crop-type-response.dto';
import { CropTypeQueryDto } from './dto/crop-type-query.dto';

@Injectable()
export class CropTypesService {
  constructor(
    @InjectRepository(CropType)
    private readonly cropTypeRepo: Repository<CropType>,
  ) {}

  async create(dto: CreateCropTypeDto): Promise<CropTypeResponseDto> {
    const crop = this.cropTypeRepo.create({
      code: dto.code,
      nameFa: dto.name_fa,
      nameEn: dto.name_en,
      scientificName: dto.scientific_name ?? null,
      category: dto.category ?? null,
      isActive: dto.is_active ?? true,
    });
    return this.toDto(await this.cropTypeRepo.save(crop));
  }

  async findAll(query: CropTypeQueryDto): Promise<CropTypeResponseDto[]> {
    const where: Record<string, unknown> = {};
    if (query.q) {
      where.nameEn = ILike(`%${query.q}%`);
    }
    if (query.category) {
      where.category = query.category;
    }
    if (query.is_active !== undefined) {
      where.isActive = query.is_active;
    }
    const crops = await this.cropTypeRepo.find({
      where: where as never,
      order: { code: 'ASC' },
    });
    return crops.map((c) => this.toDto(c));
  }

  async findOne(id: string): Promise<CropTypeResponseDto> {
    const crop = await this.cropTypeRepo.findOne({ where: { id } });
    if (!crop) throw new NotFoundException('CROP_TYPE_NOT_FOUND');
    return this.toDto(crop);
  }

  async update(id: string, dto: UpdateCropTypeDto): Promise<CropTypeResponseDto> {
    const crop = await this.cropTypeRepo.findOne({ where: { id } });
    if (!crop) throw new NotFoundException('CROP_TYPE_NOT_FOUND');
    if (dto.code !== undefined) crop.code = dto.code;
    if (dto.name_fa !== undefined) crop.nameFa = dto.name_fa;
    if (dto.name_en !== undefined) crop.nameEn = dto.name_en;
    if (dto.scientific_name !== undefined) crop.scientificName = dto.scientific_name;
    if (dto.category !== undefined) crop.category = dto.category;
    if (dto.is_active !== undefined) crop.isActive = dto.is_active;
    return this.toDto(await this.cropTypeRepo.save(crop));
  }

  async remove(id: string): Promise<void> {
    const crop = await this.cropTypeRepo.findOne({ where: { id } });
    if (!crop) throw new NotFoundException('CROP_TYPE_NOT_FOUND');
    await this.cropTypeRepo.remove(crop);
  }

  private toDto(crop: CropType): CropTypeResponseDto {
    const dto = new CropTypeResponseDto();
    dto.id = crop.id;
    dto.code = crop.code;
    dto.name_fa = crop.nameFa;
    dto.name_en = crop.nameEn;
    dto.scientific_name = crop.scientificName;
    dto.category = crop.category;
    dto.is_active = crop.isActive;
    return dto;
  }
}
