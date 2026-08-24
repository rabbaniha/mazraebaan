import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ulid } from 'ulid';
import { FarmPlot } from './entities/farm-plot.entity';
import { CreateFarmPlotDto } from './dto/create-farm-plot.dto';
import { UpdateFarmPlotDto } from './dto/update-farm-plot.dto';
import { FarmPlotResponseDto } from './dto/farm-plot-response.dto';
import type { GeoJsonMultiPolygon } from '../common/geometry/geo-json.types';

interface PlotRawRow {
  p_id: string;
  p_farm_id: string;
  p_farm_boundary_id: string;
  p_name: string;
  p_code: string | null;
  p_area_m2: string;
  p_area_ha: string;
  p_created_at: Date;
  p_updated_at: Date;
  geometry_geo?: GeoJsonMultiPolygon;
}

@Injectable()
export class FarmPlotsService {
  constructor(
    @InjectRepository(FarmPlot)
    private readonly plotRepo: Repository<FarmPlot>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    farmId: string,
    dto: CreateFarmPlotDto,
  ): Promise<FarmPlotResponseDto> {
    const id = ulid();
    await this.dataSource.transaction(async (manager) => {
      await this.assertBoundaryBelongsToFarm(manager, dto.farm_boundary_id, farmId);
      await this.assertContainedInBoundary(manager, dto.geometry, dto.farm_boundary_id);

      await manager.query(
        `INSERT INTO farm_plots
           (id, farm_id, farm_boundary_id, name, code, geometry, area_m2, area_ha)
         VALUES (
           $1, $2, $3, $4, $5,
           ST_GeomFromGeoJSON($6),
           ST_Area(ST_GeomFromGeoJSON($6)::geography, true),
           ST_Area(ST_GeomFromGeoJSON($6)::geography, true) / 10000.0
         )
         RETURNING id;`,
        [id, farmId, dto.farm_boundary_id, dto.name, dto.code ?? null, JSON.stringify(dto.geometry)],
      );
    });

    return this.findOne(farmId, id);
  }

  async findAll(farmId: string): Promise<FarmPlotResponseDto[]> {
    const rows = (await this.plotRepo
      .createQueryBuilder('p')
      .addSelect('ST_AsGeoJSON(p.geometry)::json', 'geometry_geo')
      .where('p.farm_id = :farmId', { farmId })
      .orderBy('p.created_at', 'ASC')
      .getRawMany()) as unknown as PlotRawRow[];
    return rows.map((r) => this.fromRaw(r));
  }

  async findOne(farmId: string, id: string): Promise<FarmPlotResponseDto> {
    const row = (await this.plotRepo
      .createQueryBuilder('p')
      .addSelect('ST_AsGeoJSON(p.geometry)::json', 'geometry_geo')
      .where('p.id = :id', { id })
      .andWhere('p.farm_id = :farmId', { farmId })
      .getRawOne()) as unknown as PlotRawRow | undefined;
    if (!row) throw new NotFoundException('PLOT_NOT_FOUND');
    return this.fromRaw(row);
  }

  async update(
    farmId: string,
    id: string,
    dto: UpdateFarmPlotDto,
  ): Promise<FarmPlotResponseDto> {
    const plot = await this.plotRepo.findOne({ where: { id, farmId } });
    if (!plot) throw new NotFoundException('PLOT_NOT_FOUND');

    if (dto.name !== undefined) plot.name = dto.name;
    if (dto.code !== undefined) plot.code = dto.code;

    if (dto.geometry !== undefined) {
      await this.dataSource.transaction(async (manager) => {
        await this.assertContainedInBoundary(manager, dto.geometry!, plot.farmBoundaryId);
        await manager.query(
          `UPDATE farm_plots
             SET geometry = ST_GeomFromGeoJSON($1),
                 area_m2 = ST_Area(ST_GeomFromGeoJSON($1)::geography, true),
                 area_ha = ST_Area(ST_GeomFromGeoJSON($1)::geography, true) / 10000.0
           WHERE id = $2;`,
          [JSON.stringify(dto.geometry), id],
        );
      });
    }

    await this.plotRepo.save(plot);
    return this.findOne(farmId, id);
  }

  async remove(farmId: string, id: string): Promise<void> {
    const plot = await this.plotRepo.findOne({ where: { id, farmId } });
    if (!plot) throw new NotFoundException('PLOT_NOT_FOUND');
    await this.plotRepo.remove(plot);
  }

  // --- private helpers ------------------------------------------------------

  private async assertBoundaryBelongsToFarm(
    manager: EntityManager,
    boundaryId: string,
    farmId: string,
  ): Promise<void> {
    const rows: Array<{ id: string }> = await manager.query(
      `SELECT id FROM farm_boundaries WHERE id = $1 AND farm_id = $2;`,
      [boundaryId, farmId],
    );
    if (rows.length === 0) {
      throw new NotFoundException('BOUNDARY_NOT_FOUND_FOR_FARM');
    }
  }

  private async assertContainedInBoundary(
    manager: EntityManager,
    geometry: GeoJsonMultiPolygon,
    boundaryId: string,
  ): Promise<void> {
    const rows: Array<{ covered: boolean }> = await manager.query(
      `SELECT ST_CoveredBy(
         ST_GeomFromGeoJSON($1),
         (SELECT geometry FROM farm_boundaries WHERE id = $2)
       ) AS covered;`,
      [JSON.stringify(geometry), boundaryId],
    );
    if (!rows[0]?.covered) {
      throw new BadRequestException('PLOT_NOT_WITHIN_BOUNDARY');
    }
  }

  private fromRaw(r: PlotRawRow): FarmPlotResponseDto {
    const dto = new FarmPlotResponseDto();
    dto.id = r.p_id;
    dto.farm_id = r.p_farm_id;
    dto.farm_boundary_id = r.p_farm_boundary_id;
    dto.name = r.p_name;
    dto.code = r.p_code;
    dto.geometry = r.geometry_geo as GeoJsonMultiPolygon;
    dto.area_m2 = Number(r.p_area_m2);
    dto.area_ha = Number(r.p_area_ha);
    dto.created_at = r.p_created_at;
    dto.updated_at = r.p_updated_at;
    return dto;
  }
}
