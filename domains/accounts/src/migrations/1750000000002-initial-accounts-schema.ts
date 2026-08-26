import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial Accounts Service schema (`accounts_db`).
 *
 * Raw SQL rather than TypeORM `synchronize` so the schema carries CHECK
 * constraints for status-like VARCHAR columns (Critical Rule #9 — never
 * native ENUM), partial/unique indexes, and explicit FK actions.
 *
 * Cross-service references (user_id, created_by, farm_id, …) are plain ULID
 * columns with NO database FK — only entities owned by this service get FKs
 * (Critical Rule #1 / ADR: no cross-service foreign keys).
 */
export class InitialAccountsSchema1750000000002 implements MigrationInterface {
  name = 'InitialAccountsSchema1750000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ---------------------------------------------------------------- accounts
    await queryRunner.query(`
      CREATE TABLE accounts (
        id varchar(26) PRIMARY KEY,
        account_type varchar(20) NOT NULL DEFAULT 'individual',
        status varchar(25) NOT NULL DEFAULT 'pending',
        display_name text NOT NULL,
        country_code char(2) NOT NULL DEFAULT 'IR',
        locale varchar(10) NOT NULL DEFAULT 'fa-IR',
        timezone varchar(50) NOT NULL DEFAULT 'Asia/Tehran',
        calendar_preference varchar(10) NOT NULL DEFAULT 'jalali',
        measurement_system varchar(10) NOT NULL DEFAULT 'metric',
        default_currency_code char(3) NOT NULL DEFAULT 'IRT',
        data_region varchar(30) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz,
        CONSTRAINT chk_accounts_type CHECK (account_type IN ('individual','organization')),
        CONSTRAINT chk_accounts_status CHECK (status IN ('pending','active','archived')),
        CONSTRAINT chk_accounts_calendar CHECK (calendar_preference IN ('jalali','gregorian')),
        CONSTRAINT chk_accounts_measurement CHECK (measurement_system IN ('metric','imperial'))
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_accounts_status ON accounts(status);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_accounts_deleted_at ON accounts(deleted_at) WHERE deleted_at IS NOT NULL;`,
    );

    // ------------------------------------------------------------------- roles
    await queryRunner.query(`
      CREATE TABLE roles (
        id varchar(26) PRIMARY KEY,
        name varchar(50) NOT NULL UNIQUE,
        is_system boolean NOT NULL DEFAULT false,
        description text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // ------------------------------------------------------------- permissions
    await queryRunner.query(`
      CREATE TABLE permissions (
        id varchar(26) PRIMARY KEY,
        name varchar(100) NOT NULL UNIQUE,
        resource varchar(50) NOT NULL,
        action varchar(50) NOT NULL,
        description text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // --------------------------------------------------------- role_permissions
    await queryRunner.query(`
      CREATE TABLE role_permissions (
        id varchar(26) PRIMARY KEY,
        role_id varchar(26) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id varchar(26) NOT NULL REFERENCES permissions(id) ON DELETE RESTRICT,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uniq_role_permissions UNIQUE (role_id, permission_id)
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);`,
    );

    // ---------------------------------------------------------- account_members
    await queryRunner.query(`
      CREATE TABLE account_members (
        id varchar(26) PRIMARY KEY,
        account_id varchar(26) NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
        user_id varchar(26) NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'invited',
        invited_at timestamptz NOT NULL,
        joined_at timestamptz,
        last_active_at timestamptz,
        invited_by varchar(26),
        removed_by varchar(26),
        removed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uniq_account_members_account_user UNIQUE (account_id, user_id),
        CONSTRAINT chk_account_members_status CHECK (
          status IN ('invited','active','removed','declined')
        )
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_account_members_user_id ON account_members(user_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_account_members_status ON account_members(status);`,
    );

    // ---------------------------------------------------- account_member_roles
    await queryRunner.query(`
      CREATE TABLE account_member_roles (
        id varchar(26) PRIMARY KEY,
        account_member_id varchar(26) NOT NULL REFERENCES account_members(id) ON DELETE CASCADE,
        role_id varchar(26) NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uniq_account_member_roles UNIQUE (account_member_id, role_id)
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_account_member_roles_role ON account_member_roles(role_id);`,
    );

    // --------------------------------------------------------- account_invites
    await queryRunner.query(`
      CREATE TABLE account_invites (
        id varchar(26) PRIMARY KEY,
        account_id varchar(26) NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
        email text NOT NULL,
        token text NOT NULL UNIQUE,
        role_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
        status varchar(15) NOT NULL DEFAULT 'pending',
        expires_at timestamptz NOT NULL,
        accepted_at timestamptz,
        revoked_at timestamptz,
        created_by varchar(26) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz,
        CONSTRAINT chk_account_invites_status CHECK (
          status IN ('pending','accepted','revoked','declined')
        )
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_account_invites_account_email ON account_invites(account_id, email);`,
    );

    // ------------------------------------------------------------ organizations
    await queryRunner.query(`
      CREATE TABLE organizations (
        id varchar(26) PRIMARY KEY,
        account_id varchar(26) NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE RESTRICT,
        legal_name text NOT NULL,
        brand_name text,
        registration_number text,
        tax_identifier text,
        billing_email text,
        billing_phone text,
        size_category varchar(15) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_organizations_size CHECK (
          size_category IN ('solo','small','medium','enterprise')
        )
      );
    `);

    // ------------------------------------------------------ staff_access_grants
    await queryRunner.query(`
      CREATE TABLE staff_access_grants (
        id varchar(26) PRIMARY KEY,
        staff_user_id varchar(26) NOT NULL,
        account_id varchar(26) REFERENCES accounts(id) ON DELETE CASCADE,
        farm_id varchar(26),
        access_scope varchar(15) NOT NULL,
        access_level varchar(15) NOT NULL,
        granted_by_user_id varchar(26) NOT NULL,
        reason text NOT NULL,
        starts_at timestamptz NOT NULL,
        expires_at timestamptz NOT NULL,
        revoked_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_staff_access_grants_scope CHECK (
          access_scope IN ('system','account','farm')
        ),
        CONSTRAINT chk_staff_access_grants_level CHECK (
          access_level IN ('support','agronomist','admin')
        ),
        CONSTRAINT chk_staff_access_grants_window CHECK (starts_at < expires_at)
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_staff_access_grants_staff ON staff_access_grants(staff_user_id);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS staff_access_grants;`);
    await queryRunner.query(`DROP TABLE IF EXISTS organizations;`);
    await queryRunner.query(`DROP TABLE IF EXISTS account_invites;`);
    await queryRunner.query(`DROP TABLE IF EXISTS account_member_roles;`);
    await queryRunner.query(`DROP TABLE IF EXISTS account_members;`);
    await queryRunner.query(`DROP TABLE IF EXISTS role_permissions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS permissions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS roles;`);
    await queryRunner.query(`DROP TABLE IF EXISTS accounts;`);
  }
}
