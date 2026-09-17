import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '@/lib/config/env';
import * as schema from './schema';

/*
 * Ein Pool je Prozess. In der Entwicklung hält Next die Module über Neuladen
 * hinweg; ohne diese Zwischenablage entstünde bei jedem Speichern ein
 * weiterer Pool, bis PostgreSQL keine Verbindungen mehr vergibt.
 */
const global_ = globalThis as unknown as { evidariumPool?: Pool };

const pool =
  global_.evidariumPool ??
  new Pool({ connectionString: env.DATABASE_URL, max: 10, idleTimeoutMillis: 30_000 });

if (process.env.NODE_ENV !== 'production') global_.evidariumPool = pool;

export const db = drizzle(pool, { schema });
export { schema };
