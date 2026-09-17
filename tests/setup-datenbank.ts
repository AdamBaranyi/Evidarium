import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

/*
 * Die Testdatenbank liegt auf tmpfs und startet bei jedem Containerstart leer.
 * Vor den Tests wandern die Migrationen einmal durch — sonst prüft ein roter
 * Lauf nur, dass die Tabellen fehlen.
 */
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('TEST_DATABASE_URL fehlt. Vorlage: .env.example');

  const pool = new Pool({ connectionString: url });
  try {
    await migrate(drizzle(pool), { migrationsFolder: './src/lib/db/migrations' });
  } finally {
    await pool.end();
  }
}
