import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial Farm Service schema.
 *
 * Deliberately uses raw SQL rather than TypeORM `synchronize`: the schema needs
 * PostGIS geometry columns, CHECK constraints (VARCHAR enums per ADR-005),
 * partial unique indexes, GiST spatial indexes, and a DEFERRABLE circular FK —
 * none of which `synchronize` can emit correctly.
 *
 * See docs/farm-service-entity-dto-design.md for the rationale behind each
 * constraint and index.
 */
export class InitialFarmSchema1750000000000 implements MigrationInterface {
  name = 'InitialFarmSchema1750000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);

    // ----------------------------------------------------------------- farms
    await queryRunner.query(`
      CREATE TABLE farms (
        id varchar(26) PRIMARY KEY,
        account_id varchar(26) NOT NULL,
        code varchar(50),
        name varchar(200) NOT NULL,
        description text,
        status varchar(20) NOT NULL DEFAULT 'draft',
        primary_manager_user_id varchar(26),
        created_by_user_id varchar(26) NOT NULL,
        country_code char(2) NOT NULL DEFAULT 'IR',
        state_province varchar(100) NOT NULL,
        county varchar(100) NOT NULL,
        district varchar(100) NOT NULL,
        village varchar(100),
        timezone varchar(50) NOT NULL DEFAULT 'Asia/Tehran',
        current_boundary_id varchar(26),
        centroid_geom geometry(Point,4326),
        bbox_geom geometry(Polygon,4326),
        current_area_m2 numeric(20,4),
        current_area_ha numeric(14,4),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz,
        purge_after timestamptz,
        CONSTRAINT chk_farms_status CHECK (status IN ('draft','active','archived','deleted'))
      );
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX uniq_farms_code ON farms(code) WHERE code IS NOT NULL;`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX uniq_farms_current_boundary ON farms(current_boundary_id) WHERE current_boundary_id IS NOT NULL;`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_farms_account_id ON farms(account_id);`,
    );
    await queryRunner.query(`CREATE INDEX idx_farms_status ON farms(status);`);
    await queryRunner.query(
      `CREATE INDEX idx_farms_deleted_at ON farms(deleted_at) WHERE deleted_at IS NOT NULL;`,
    );

    // ------------------------------------------------------ farm_boundaries
    await queryRunner.query(`
      CREATE TABLE farm_boundaries (
        id varchar(26) PRIMARY KEY,
        farm_id varchar(26) NOT NULL REFERENCES farms(id) ON DELETE RESTRICT,
        version_no int NOT NULL,
        geometry geometry(MultiPolygon,4326) NOT NULL,
        boundary_source varchar(30) NOT NULL,
        area_m2 numeric(20,4) NOT NULL,
        area_ha numeric(14,4) NOT NULL,
        centroid_geom geometry(Point,4326) NOT NULL,
        bbox_geom geometry(Polygon,4326) NOT NULL,
        valid_from timestamptz NOT NULL,
        valid_to timestamptz,
        change_reason text,
        created_by_user_id varchar(26) NOT NULL,
        approved_by_user_id varchar(26),
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uniq_farm_boundaries_version UNIQUE (farm_id, version_no),
        CONSTRAINT chk_farm_boundaries_source CHECK (boundary_source IN ('user_drawn','uploaded_geojson','uploaded_kml','admin_corrected','imported')),
        CONSTRAINT chk_farm_boundaries_valid CHECK (valid_to IS NULL OR valid_from < valid_to),
        CONSTRAINT chk_farm_boundaries_area_m2 CHECK (area_m2 >= 0),
        CONSTRAINT chk_farm_boundaries_area_ha CHECK (area_ha >= 0)
      );
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX uniq_farm_boundaries_open ON farm_boundaries(farm_id) WHERE valid_to IS NULL;`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_farm_boundaries_farm_id ON farm_boundaries(farm_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_farm_boundaries_geometry ON farm_boundaries USING GIST(geometry);`,
    );

    // ------------------------------------------- farm_boundary_change_logs
    await queryRunner.query(`
      CREATE TABLE farm_boundary_change_logs (
        id varchar(26) PRIMARY KEY,
        farm_id varchar(26) NOT NULL REFERENCES farms(id) ON DELETE RESTRICT,
        old_boundary_id varchar(26),
        new_boundary_id varchar(26) NOT NULL,
        changed_by_user_id varchar(26) NOT NULL,
        change_type varchar(20) NOT NULL,
        reason text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_farm_boundary_change_logs_type CHECK (change_type IN ('create','replace','adjust','restore_old'))
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_change_logs_farm ON farm_boundary_change_logs(farm_id, created_at DESC);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_change_logs_old ON farm_boundary_change_logs(old_boundary_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_change_logs_new ON farm_boundary_change_logs(new_boundary_id);`,
    );

    // -------------------------------------------------------- farm_seasons
    await queryRunner.query(`
      CREATE TABLE farm_seasons (
        id varchar(26) PRIMARY KEY,
        farm_id varchar(26) NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
        name varchar(100) NOT NULL,
        crop_year smallint NOT NULL,
        season_type varchar(20) NOT NULL,
        start_date date NOT NULL,
        end_date date,
        status varchar(20) NOT NULL DEFAULT 'planned',
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_farm_seasons_type CHECK (season_type IN ('spring','summer','autumn','winter','custom')),
        CONSTRAINT chk_farm_seasons_status CHECK (status IN ('planned','active','completed','canceled')),
        CONSTRAINT chk_farm_seasons_dates CHECK (end_date IS NULL OR start_date <= end_date)
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_farm_seasons_farm ON farm_seasons(farm_id, crop_year);`,
    );

    // ---------------------------------------------------------- farm_plots
    await queryRunner.query(`
      CREATE TABLE farm_plots (
        id varchar(26) PRIMARY KEY,
        farm_id varchar(26) NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
        farm_boundary_id varchar(26) NOT NULL REFERENCES farm_boundaries(id) ON DELETE RESTRICT,
        name varchar(100) NOT NULL,
        code varchar(50),
        geometry geometry(MultiPolygon,4326) NOT NULL,
        area_m2 numeric(20,4) NOT NULL,
        area_ha numeric(14,4) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_farm_plots_area_m2 CHECK (area_m2 >= 0),
        CONSTRAINT chk_farm_plots_area_ha CHECK (area_ha >= 0)
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_farm_plots_farm ON farm_plots(farm_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_farm_plots_boundary ON farm_plots(farm_boundary_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_farm_plots_geometry ON farm_plots USING GIST(geometry);`,
    );

    // ---------------------------------------------------------- crop_types
    await queryRunner.query(`
      CREATE TABLE crop_types (
        id varchar(26) PRIMARY KEY,
        code varchar(50) NOT NULL,
        name_fa varchar(100) NOT NULL,
        name_en varchar(100) NOT NULL,
        scientific_name varchar(150),
        category varchar(100),
        is_active boolean NOT NULL DEFAULT true
      );
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX uniq_crop_types_code ON crop_types(code);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_crop_types_active ON crop_types(is_active) WHERE is_active;`,
    );

    // --------------------------------------------------- farm_cultivations
    await queryRunner.query(`
      CREATE TABLE farm_cultivations (
        id varchar(26) PRIMARY KEY,
        farm_id varchar(26) NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
        farm_season_id varchar(26) REFERENCES farm_seasons(id) ON DELETE SET NULL,
        farm_plot_id varchar(26) REFERENCES farm_plots(id) ON DELETE SET NULL,
        crop_type_id varchar(26) NOT NULL REFERENCES crop_types(id) ON DELETE RESTRICT,
        cultivation_mode varchar(20) NOT NULL,
        sowing_date date,
        transplant_date date,
        harvest_date date,
        expected_harvest_date date,
        status varchar(20) NOT NULL DEFAULT 'planned',
        notes text,
        created_by_user_id varchar(26) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_farm_cultivations_mode CHECK (cultivation_mode IN ('irrigated','rainfed','greenhouse','orchard','open_field')),
        CONSTRAINT chk_farm_cultivations_status CHECK (status IN ('planned','active','harvested','failed')),
        CONSTRAINT chk_farm_cultivations_sow_transplant CHECK (sowing_date IS NULL OR transplant_date IS NULL OR sowing_date <= transplant_date),
        CONSTRAINT chk_farm_cultivations_sow_harvest CHECK (sowing_date IS NULL OR harvest_date IS NULL OR sowing_date <= harvest_date),
        CONSTRAINT chk_farm_cultivations_transplant_harvest CHECK (transplant_date IS NULL OR harvest_date IS NULL OR transplant_date <= harvest_date)
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_farm_cultivations_farm ON farm_cultivations(farm_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_farm_cultivations_season ON farm_cultivations(farm_season_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_farm_cultivations_plot ON farm_cultivations(farm_plot_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_farm_cultivations_crop ON farm_cultivations(crop_type_id);`,
    );

    // --------------------------------------------------- farm_access_grants
    await queryRunner.query(`
      CREATE TABLE farm_access_grants (
        id varchar(26) PRIMARY KEY,
        farm_id varchar(26) NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
        grantee_user_id varchar(26) NOT NULL,
        access_role varchar(20) NOT NULL,
        granted_by_user_id varchar(26) NOT NULL,
        granted_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz,
        revoked_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_farm_access_grants_role CHECK (access_role IN ('manager','editor','viewer','advisor')),
        CONSTRAINT chk_farm_access_grants_expires CHECK (expires_at IS NULL OR expires_at > granted_at),
        CONSTRAINT chk_farm_access_grants_revoked CHECK (revoked_at IS NULL OR revoked_at >= granted_at)
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_farm_access_grants_farm ON farm_access_grants(farm_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_farm_access_grants_grantee ON farm_access_grants(grantee_user_id);`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX uniq_farm_access_grants_active ON farm_access_grants(farm_id, grantee_user_id, access_role) WHERE revoked_at IS NULL;`,
    );

    // ------------------------------- circular FK: farms -> farm_boundaries
    // Added after both tables exist. DEFERRABLE so the replace-boundary
    // transaction can insert the new boundary and point the farm at it within
    // the same transaction before the FK is checked at COMMIT.
    await queryRunner.query(`
      ALTER TABLE farms
        ADD CONSTRAINT fk_farms_current_boundary
        FOREIGN KEY (current_boundary_id) REFERENCES farm_boundaries(id)
        ON DELETE SET NULL
        DEFERRABLE INITIALLY DEFERRED;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE farms DROP CONSTRAINT IF EXISTS fk_farms_current_boundary;`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS farm_access_grants;`);
    await queryRunner.query(`DROP TABLE IF EXISTS farm_cultivations;`);
    await queryRunner.query(`DROP TABLE IF EXISTS crop_types;`);
    await queryRunner.query(`DROP TABLE IF EXISTS farm_plots;`);
    await queryRunner.query(`DROP TABLE IF EXISTS farm_seasons;`);
    await queryRunner.query(`DROP TABLE IF EXISTS farm_boundary_change_logs;`);
    await queryRunner.query(`DROP TABLE IF EXISTS farm_boundaries;`);
    await queryRunner.query(`DROP TABLE IF EXISTS farms;`);
  }
}
