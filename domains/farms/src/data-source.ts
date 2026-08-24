import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { InitialFarmSchema1750000000000 } from './migrations/1750000000000-initial-farm-schema';

/**
 * TypeORM DataSource for the Farm Service (`farms_db`).
 *
 * Used by the TypeORM CLI (`npm run migration:run`) and by tests that need a
 * live database. `synchronize` is always false — the schema is owned by
 * migrations (see src/migrations/).
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'mazraebaan',
  password: process.env.DB_PASS ?? 'mazraebaan_dev_pass',
  database: process.env.DB_NAME ?? 'farms_db',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [InitialFarmSchema1750000000000],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
