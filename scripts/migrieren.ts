import { join } from 'node:path';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import { PgBoss } from 'pg-boss';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

/*
 * Migrationen einspielen, ohne `drizzle-kit`.
 *
 * `drizzle-kit` ist ein Entwicklungspaket und hat im Produktionsabbild nichts
 * zu suchen; der Migrator steckt in `drizzle-orm`, das ohnehin zur Laufzeit
 * dabei ist. Erzeugt werden die Dateien weiterhin mit `bun run db:generate`
 * auf dem Entwicklungsrechner.
 *
 * Läuft als **Eigentümerrolle**: Die Anwendungsrolle darf keine Tabellen
 * anlegen, und genau das ist der Sinn der zwei Rollen.
 */

const url = process.env.DATABASE_URL_OWNER ?? process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL_OWNER oder DATABASE_URL fehlt.');
  process.exit(1);
}

const verbindung: string = url;
const pool = new Pool({ connectionString: verbindung, max: 1 });

/*
 * pg-boss legt sein Schema beim ersten Start selbst an — und braucht dafür
 * Rechte, die die Anwendungsrolle nicht hat und nicht haben soll.
 *
 * Gefunden am 18.09.2026 im ersten Produktionslauf: «permission denied for
 * database evidarium», der Worker lief in eine Neustartschleife. Auf dem
 * Entwicklungsrechner fiel es nie auf, weil dort `DATABASE_URL_OWNER` gesetzt
 * ist und die Warteschlange damit als Eigentümer lief.
 *
 * Darum hier, als Teil der Migration: Der Eigentümer legt das Schema an, die
 * Anwendungsrolle bekommt darauf die nötigen Rechte. `CREATE` ist dabei kein
 * Versehen — pg-boss legt je Warteschlange eine Partition an. Die Rolle darf
 * damit **nur im Schema `pgboss`** Objekte anlegen, nicht in `public`, und
 * bleibt Nicht-Eigentümerin: Row Level Security umgeht sie weiterhin nicht.
 */
async function warteschlangeEinrichten(datenbank: NodePgDatabase): Promise<void> {
  const boss = new PgBoss({ connectionString: verbindung });
  await boss.start();
  await boss.stop({ graceful: false });

  await datenbank.execute(sql`
    GRANT USAGE, CREATE ON SCHEMA pgboss TO evidarium_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA pgboss TO evidarium_app;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA pgboss TO evidarium_app;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pgboss TO evidarium_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA pgboss
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO evidarium_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA pgboss
      GRANT USAGE, SELECT ON SEQUENCES TO evidarium_app;
  `);
}

try {
  const datenbank = drizzle(pool);

  await migrate(datenbank, {
    migrationsFolder: join(import.meta.dirname, '..', 'src', 'lib', 'db', 'migrations'),
  });
  console.log('Migrationen eingespielt.');

  await warteschlangeEinrichten(datenbank);
  console.log('Warteschlange eingerichtet, Rechte gesetzt.');
} finally {
  await pool.end();
}
