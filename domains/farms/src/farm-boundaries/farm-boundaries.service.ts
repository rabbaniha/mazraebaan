import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ulid } from 'ulid';
import { FarmBoundary } from './entities/farm-boundary.entity';
import { CreateFarmBoundaryDto } from './dto/create-farm-boundary.dto';
import { ReplaceFarmBoundaryDto } from './dto/replace-farm-boundary.dto';
import { RestoreFarmBoundaryDto } from './dto/restore-farm-boundary.dto';
import { FarmBoundaryResponseDto } from './dto/farm-boundary-response.dto';
import { FarmBoundaryHistoryDto } from './dto/farm-boundary-history.dto';
import type { BoundaryChangeType, BoundarySource } from '../common/enums';
import type {
  GeoJsonMultiPolygon,
  GeoJsonPoint,
  GeoJsonPolygon,
} from '../common/geometry/geo-json.types';

interface BoundaryRawRow {
  b_id: string;
  b_farm_id: string;
  b_version_no: number;
  b_boundary_source: BoundarySource;
  b_area_m2: string;
  b_area_ha: string;
  b_valid_from: Date;
  b_valid_to: Date | null;
  b_change_reason: string | null;
  b_created_by_user_id: string;
  b_approved_by_user_id: string | null;
  b_created_at: Date;
  geometry_geo?: GeoJsonMultiPolygon;
  centroid_geo?: GeoJsonPoint;
  bbox_geo?: GeoJsonPolygon;
}

@Injectable()
export class FarmBoundariesService {
  constructor(
    @InjectRepository(FarmBoundary)
    private readonly boundaryRepo: Repository<FarmBoundary>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Creates the FIRST boundary for a farm. Rejected if the farm already has a
   * current boundary (use replace/restore instead).
   */
  async create(
    farmId: string,
    dto: CreateFarmBoundaryDto,
    userId: string,
  ): Promise<FarmBoundaryResponseDto> {
    const id = ulid();
    await this.dataSource.transaction(async (manager) => {
      const farm = await this.lockFarm(manager, farmId);
      if (farm.current_boundary_id) {
        throw new BadRequestException('FARM_ALREADY_HAS_BOUNDARY');
      }
      await this.assertValidGeometry(manager, dto.geometry);

      await manager.query(
        this.insertBoundarySql(),
        [
          id,
          farmId,
          1,
          JSON.stringify(dto.geometry),
          dto.boundary_source,
          dto.change_reason ?? null,
          userId,
        ],
      );
      await this.updateFarmSnapshot(manager, farmId, id, dto.geometry);
      await this.insertChangeLog(manager, {
        farmId,
        oldBoundaryId: null,
        newBoundaryId: id,
        changedByUserId: userId,
        changeType: 'create',
        reason: dto.change_reason ?? '',
      });
    });

    return this.findOne(farmId, id);
  }

  /**
   * Replaces the farm's current boundary with new geometry in a single
   * transaction: insert new version, close the previous one, repoint
   * `farms.current_boundary_id`, update denormalized snapshots, log the change.
   */
  async replace(
    farmId: string,
    dto: ReplaceFarmBoundaryDto,
    userId: string,
  ): Promise<FarmBoundaryResponseDto> {
    const id = ulid();
    await this.dataSource.transaction(async (manager) => {
      const farm = await this.lockFarm(manager, farmId);
      if (!farm.current_boundary_id) {
        throw new BadRequestException('FARM_HAS_NO_BOUNDARY');
      }
      await this.assertValidGeometry(manager, dto.geometry);

      const versionNo = await this.nextVersionNo(manager, farmId);

      await manager.query(this.insertBoundarySql(), [
        id,
        farmId,
        versionNo,
        JSON.stringify(dto.geometry),
        dto.boundary_source,
        dto.change_reason,
        userId,
      ]);
      await manager.query(
        `UPDATE farm_boundaries SET valid_to = now() WHERE id = $1;`,
        [farm.current_boundary_id],
      );
      await this.updateFarmSnapshot(manager, farmId, id, dto.geometry);
      await this.insertChangeLog(manager, {
        farmId,
        oldBoundaryId: farm.current_boundary_id,
        newBoundaryId: id,
        changedByUserId: userId,
        changeType: 'replace',
        reason: dto.change_reason,
      });
    });

    return this.findOne(farmId, id);
  }

  /**
   * Restores a historical boundary by COPYING its geometry into a new immutable
   * version (`change_type = restore_old`). The original row is never reopened.
   */
  async restore(
    farmId: string,
    dto: RestoreFarmBoundaryDto,
    userId: string,
  ): Promise<FarmBoundaryResponseDto> {
    const id = ulid();
    await this.dataSource.transaction(async (manager) => {
      const farm = await this.lockFarm(manager, farmId);
      if (!farm.current_boundary_id) {
        throw new BadRequestException('FARM_HAS_NO_BOUNDARY');
      }
      if (farm.current_boundary_id === dto.boundary_id) {
        throw new BadRequestException('BOUNDARY_ALREADY_CURRENT');
      }

      const versionNo = await this.nextVersionNo(manager, farmId);

      const result: Array<{ id: string }> = await manager.query(
        `INSERT INTO farm_boundaries
           (id, farm_id, version_no, geometry, boundary_source, area_m2, area_ha,
            centroid_geom, bbox_geom, valid_from, valid_to, change_reason,
            created_by_user_id, approved_by_user_id)
         SELECT $1, $2, $3, geometry, boundary_source, area_m2, area_ha,
                centroid_geom, bbox_geom, now(), NULL, $4, $5, NULL
         FROM farm_boundaries
         WHERE id = $6 AND farm_id = $2
         RETURNING id;`,
        [id, farmId, versionNo, dto.change_reason, userId, dto.boundary_id],
      );
      if (result.length === 0) {
        throw new NotFoundException('BOUNDARY_NOT_FOUND');
      }

      await manager.query(
        `UPDATE farm_boundaries SET valid_to = now() WHERE id = $1;`,
        [farm.current_boundary_id],
      );
      await this.repointFarmSnapshot(manager, farmId, id);
      await this.insertChangeLog(manager, {
        farmId,
        oldBoundaryId: farm.current_boundary_id,
        newBoundaryId: id,
        changedByUserId: userId,
        changeType: 'restore_old',
        reason: dto.change_reason,
      });
    });

    return this.findOne(farmId, id);
  }

  /** History list, most recent first. Geometry included only when requested. */
  async findAll(
    farmId: string,
    includeGeometry = false,
  ): Promise<FarmBoundaryHistoryDto[]> {
    const farm = await this.dataSource
      .getRepository(FarmBoundary)
      .manager.getRepository(FarmBoundary)
      .manager.query(`SELECT current_boundary_id FROM farms WHERE id = $1;`, [
        farmId,
      ]);
    const currentBoundaryId: string | null = farm[0]?.current_boundary_id ?? null;

    const qb = this.boundaryRepo
      .createQueryBuilder('b')
      .where('b.farm_id = :farmId', { farmId })
      .orderBy('b.version_no', 'DESC');
    if (includeGeometry) {
      qb.addSelect('ST_AsGeoJSON(b.geometry)::json', 'geometry_geo');
    }
    const rows = (await qb.getRawMany()) as unknown as BoundaryRawRow[];

    return rows.map((r) => {
      const dto = new FarmBoundaryHistoryDto();
      dto.id = r.b_id;
      dto.version_no = r.b_version_no;
      dto.valid_from = r.b_valid_from;
      dto.valid_to = r.b_valid_to;
      dto.boundary_source = r.b_boundary_source;
      dto.area_ha = Number(r.b_area_ha);
      dto.change_reason = r.b_change_reason;
      dto.created_by_user_id = r.b_created_by_user_id;
      dto.created_at = r.b_created_at;
      dto.is_current = r.b_id === currentBoundaryId;
      if (includeGeometry) dto.geometry = r.geometry_geo;
      return dto;
    });
  }

  async findOne(farmId: string, boundaryId: string): Promise<FarmBoundaryResponseDto> {
    const farmRows: Array<{ current_boundary_id: string | null }> =
      await this.dataSource.query(
        `SELECT current_boundary_id FROM farms WHERE id = $1;`,
        [farmId],
      );
    const currentBoundaryId = farmRows[0]?.current_boundary_id ?? null;

    const row = (await this.boundaryRepo
      .createQueryBuilder('b')
      .addSelect('ST_AsGeoJSON(b.geometry)::json', 'geometry_geo')
      .addSelect('ST_AsGeoJSON(b.centroid_geom)::json', 'centroid_geo')
      .addSelect('ST_AsGeoJSON(b.bbox_geom)::json', 'bbox_geo')
      .where('b.id = :boundaryId', { boundaryId })
      .andWhere('b.farm_id = :farmId', { farmId })
      .getRawOne()) as unknown as BoundaryRawRow | undefined;

    if (!row) throw new NotFoundException('BOUNDARY_NOT_FOUND');

    const dto = new FarmBoundaryResponseDto();
    dto.id = row.b_id;
    dto.farm_id = row.b_farm_id;
    dto.version_no = row.b_version_no;
    dto.geometry = row.geometry_geo as GeoJsonMultiPolygon;
    dto.boundary_source = row.b_boundary_source;
    dto.area_m2 = Number(row.b_area_m2);
    dto.area_ha = Number(row.b_area_ha);
    dto.centroid = row.centroid_geo as GeoJsonPoint;
    dto.bbox = row.bbox_geo as GeoJsonPolygon;
    dto.valid_from = row.b_valid_from;
    dto.valid_to = row.b_valid_to;
    dto.change_reason = row.b_change_reason;
    dto.created_by_user_id = row.b_created_by_user_id;
    dto.approved_by_user_id = row.b_approved_by_user_id;
    dto.created_at = row.b_created_at;
    dto.is_current = row.b_id === currentBoundaryId;
    return dto;
  }

  /** Administrative metadata correction: sets the approver on a boundary. */
  async approve(boundaryId: string, approverUserId: string): Promise<void> {
    const result = await this.boundaryRepo.update(
      { id: boundaryId },
      { approvedByUserId: approverUserId },
    );
    if (!result.affected) throw new NotFoundException('BOUNDARY_NOT_FOUND');
  }

  // --- private helpers (parameterized PostGIS SQL) --------------------------

  private insertBoundarySql(): string {
    return `
      INSERT INTO farm_boundaries
        (id, farm_id, version_no, geometry, boundary_source, area_m2, area_ha,
         centroid_geom, bbox_geom, valid_from, valid_to, change_reason,
         created_by_user_id, approved_by_user_id)
      VALUES (
        $1, $2, $3,
        ST_GeomFromGeoJSON($4), $5,
        ST_Area(ST_GeomFromGeoJSON($4)::geography, true),
        ST_Area(ST_GeomFromGeoJSON($4)::geography, true) / 10000.0,
        ST_PointOnSurface(ST_GeomFromGeoJSON($4)),
        ST_Envelope(ST_GeomFromGeoJSON($4)),
        now(), NULL, $6, $7, NULL
      )
      RETURNING id;`;
  }

  private async updateFarmSnapshot(
    manager: EntityManager,
    farmId: string,
    boundaryId: string,
    geometry: GeoJsonMultiPolygon,
  ): Promise<void> {
    await manager.query(
      `UPDATE farms
         SET current_boundary_id = $1,
             centroid_geom = ST_PointOnSurface(ST_GeomFromGeoJSON($3)),
             bbox_geom = ST_Envelope(ST_GeomFromGeoJSON($3)),
             current_area_m2 = ST_Area(ST_GeomFromGeoJSON($3)::geography, true),
             current_area_ha = ST_Area(ST_GeomFromGeoJSON($3)::geography, true) / 10000.0
       WHERE id = $2;`,
      [boundaryId, farmId, JSON.stringify(geometry)],
    );
  }

  private async repointFarmSnapshot(
    manager: EntityManager,
    farmId: string,
    boundaryId: string,
  ): Promise<void> {
    await manager.query(
      `UPDATE farms
         SET current_boundary_id = $1,
             centroid_geom = (SELECT centroid_geom FROM farm_boundaries WHERE id = $1),
             bbox_geom = (SELECT bbox_geom FROM farm_boundaries WHERE id = $1),
             current_area_m2 = (SELECT area_m2 FROM farm_boundaries WHERE id = $1),
             current_area_ha = (SELECT area_ha FROM farm_boundaries WHERE id = $1)
       WHERE id = $2;`,
      [boundaryId, farmId],
    );
  }

  private async insertChangeLog(
    manager: EntityManager,
    log: {
      farmId: string;
      oldBoundaryId: string | null;
      newBoundaryId: string;
      changedByUserId: string;
      changeType: BoundaryChangeType;
      reason: string;
    },
  ): Promise<void> {
    await manager.query(
      `INSERT INTO farm_boundary_change_logs
         (id, farm_id, old_boundary_id, new_boundary_id, changed_by_user_id, change_type, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7);`,
      [
        ulid(),
        log.farmId,
        log.oldBoundaryId,
        log.newBoundaryId,
        log.changedByUserId,
        log.changeType,
        log.reason,
      ],
    );
  }

  private async lockFarm(
    manager: EntityManager,
    farmId: string,
  ): Promise<{ id: string; current_boundary_id: string | null }> {
    const rows: Array<{ id: string; current_boundary_id: string | null }> =
      await manager.query(
        `SELECT id, current_boundary_id FROM farms WHERE id = $1 FOR UPDATE;`,
        [farmId],
      );
    if (!rows[0]) throw new NotFoundException('FARM_NOT_FOUND');
    return rows[0];
  }

  private async nextVersionNo(
    manager: EntityManager,
    farmId: string,
  ): Promise<number> {
    const rows: Array<{ next: string }> = await manager.query(
      `SELECT COALESCE(MAX(version_no), 0) + 1 AS next FROM farm_boundaries WHERE farm_id = $1;`,
      [farmId],
    );
    return Number(rows[0].next);
  }

  private async assertValidGeometry(
    manager: EntityManager,
    geometry: GeoJsonMultiPolygon,
  ): Promise<void> {
    const rows: Array<{ is_valid: boolean; is_multipolygon: boolean }> =
      await manager.query(
        `SELECT ST_IsValid(ST_GeomFromGeoJSON($1)) AS is_valid,
                ST_GeometryType(ST_GeomFromGeoJSON($1)) = 'ST_MultiPolygon' AS is_multipolygon;`,
        [JSON.stringify(geometry)],
      );
    if (!rows[0]?.is_valid || !rows[0]?.is_multipolygon) {
      throw new BadRequestException('BOUNDARY_GEOMETRY_INVALID');
    }
  }
}
