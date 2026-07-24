import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.SUPABASE_DATABASE_URL ||
      process.env.POSTGRES_URL;

    if (connectionString) {
      global._postgresPool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    } else {
      const isCloudOrSupabase =
        (process.env.SQL_HOST || '').includes('supabase') ||
        (process.env.SQL_HOST || '').includes('pooler');

      global._postgresPool = new Pool({
        host: process.env.SQL_HOST || process.env.SUPABASE_HOST,
        user: process.env.SQL_USER || process.env.SUPABASE_USER,
        password: process.env.SQL_PASSWORD || process.env.SUPABASE_PASSWORD,
        database: process.env.SQL_DB_NAME || process.env.SUPABASE_DB_NAME || 'postgres',
        port: Number(process.env.SQL_PORT || process.env.SUPABASE_PORT || 5432),
        ssl: isCloudOrSupabase ? { rejectUnauthorized: false } : undefined,
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    }

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });

