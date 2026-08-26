import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial Identity Service schema (`identity_db`).
 *
 * Raw SQL rather than TypeORM `synchronize` so the schema carries CHECK
 * constraints for status-like VARCHAR columns (Critical Rule #9 — never
 * native ENUM), partial/unique indexes, and explicit FK actions.
 */
export class InitialIdentitySchema1750000000001 implements MigrationInterface {
  name = 'InitialIdentitySchema1750000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ------------------------------------------------------------------ users
    await queryRunner.query(`
      CREATE TABLE users (
        id varchar(26) PRIMARY KEY,
        first_name text NOT NULL,
        last_name text NOT NULL,
        display_name text NOT NULL,
        email text UNIQUE,
        phone_number text,
        phone_country_code varchar(5),
        avatar_url text,
        birth_date date,
        locale varchar(10) NOT NULL DEFAULT 'fa-IR',
        timezone varchar(50) NOT NULL DEFAULT 'Asia/Tehran',
        calendar_preference varchar(10) NOT NULL DEFAULT 'jalali',
        status varchar(10) NOT NULL DEFAULT 'pending',
        profile_completed_at timestamptz,
        last_login_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz,
        CONSTRAINT chk_users_status CHECK (status IN ('active','blocked','pending','deleted')),
        CONSTRAINT chk_users_calendar CHECK (calendar_preference IN ('jalali','gregorian'))
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_users_phone ON users(phone_country_code, phone_number);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;`,
    );

    // --------------------------------------------------------- auth_identities
    await queryRunner.query(`
      CREATE TABLE auth_identities (
        id varchar(26) PRIMARY KEY,
        user_id varchar(26) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        provider_type varchar(20) NOT NULL,
        provider_subject text NOT NULL,
        email_normalized text,
        phone_e164 text,
        is_primary boolean NOT NULL DEFAULT false,
        is_verified boolean NOT NULL DEFAULT false,
        verified_at timestamptz,
        credential_hash text,
        metadata jsonb,
        last_used_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uniq_auth_identities_provider UNIQUE (provider_type, provider_subject),
        CONSTRAINT chk_auth_identities_provider_type CHECK (
          provider_type IN ('email_password','phone_password','phone_otp','google','apple')
        )
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_auth_identities_user_id ON auth_identities(user_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_auth_identities_email ON auth_identities(email_normalized) WHERE email_normalized IS NOT NULL;`,
    );

    // ------------------------------------------------------------ user_devices
    await queryRunner.query(`
      CREATE TABLE user_devices (
        id varchar(26) PRIMARY KEY,
        user_id varchar(26) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        device_type varchar(10) NOT NULL,
        device_name text NOT NULL,
        os_name text NOT NULL,
        app_version text,
        push_token text,
        ip_address inet NOT NULL,
        fingerprint text NOT NULL,
        browser text,
        platform text,
        is_trusted boolean NOT NULL DEFAULT false,
        last_seen_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_user_devices_type CHECK (device_type IN ('web','android','ios','desktop'))
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_user_devices_user_id ON user_devices(user_id);`,
    );

    // ---------------------------------------------------------- refresh_tokens
    await queryRunner.query(`
      CREATE TABLE refresh_tokens (
        id varchar(26) PRIMARY KEY,
        user_id varchar(26) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        device_id varchar(26) REFERENCES user_devices(id) ON DELETE SET NULL,
        token_hash text NOT NULL UNIQUE,
        family_id varchar(26) NOT NULL,
        expires_at timestamptz NOT NULL,
        revoked_at timestamptz,
        replaced_by_token_id varchar(26),
        issued_ip inet NOT NULL,
        issued_user_agent text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_refresh_tokens_family_id ON refresh_tokens(family_id);`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);`,
    );

    // ------------------------------------------------------- otp_verifications
    await queryRunner.query(`
      CREATE TABLE otp_verifications (
        id varchar(26) PRIMARY KEY,
        user_id varchar(26) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        code_hash text NOT NULL,
        purpose varchar(30) NOT NULL,
        expires_at timestamptz NOT NULL,
        max_attempts integer NOT NULL DEFAULT 5,
        attempt_count integer NOT NULL DEFAULT 0,
        verified_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uniq_otp_user_purpose UNIQUE (user_id, purpose),
        CONSTRAINT chk_otp_purpose CHECK (
          purpose IN ('register_email','register_phone','login_email','login_phone','verify_change')
        ),
        CONSTRAINT chk_otp_attempts CHECK (attempt_count >= 0 AND max_attempts > 0)
      );
    `);

    // ---------------------------------------------------- onboarding_sessions
    await queryRunner.query(`
      CREATE TABLE onboarding_sessions (
        id varchar(26) PRIMARY KEY,
        user_id varchar(26) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        token_hash varchar(64) NOT NULL UNIQUE,
        status varchar(30) NOT NULL DEFAULT 'account_required',
        verification_channel varchar(10),
        expires_at timestamptz NOT NULL,
        completed_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_onboarding_sessions_status CHECK (
          status IN ('account_required','verification_pending','completed')
        ),
        CONSTRAINT chk_onboarding_sessions_channel CHECK (
          verification_channel IS NULL OR verification_channel IN ('email','phone')
        )
      );
    `);
    await queryRunner.query(
      `CREATE INDEX idx_onboarding_sessions_user_id ON onboarding_sessions(user_id);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS onboarding_sessions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS otp_verifications;`);
    await queryRunner.query(`DROP TABLE IF EXISTS refresh_tokens;`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_devices;`);
    await queryRunner.query(`DROP TABLE IF EXISTS auth_identities;`);
    await queryRunner.query(`DROP TABLE IF EXISTS users;`);
  }
}
