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
 * Hintergrund-Migrationen gehören in diesen Lauf.
 *
 * Nach einem Update baut pg-boss manche Indizes im Hintergrund (BAM), und zwar
 * «die nächste Instanz mit migrate». Live sind das Web und Worker als
 * Anwendungsrolle; die darf auf Tabellen des Eigentümers keine Indizes bauen
 * und scheiterte mit «must be owner of table», bei jedem Takt aufs Neue
 * (nachgestellt am 21.10.2026). Darum baut der Eigentümer hier alles fertig.
 *
 * Gescheitert heisst: in diesem Lauf als Eigentümer gescheitert. Ältere
 * Fehlschläge der Anwendungsrolle holt pg-boss selbst nach. Scheitert ein Bau
 * auch hier, endet die Migration mit Fehler, und `deploy.sh` startet die neue
 * Anwendung nicht.
 */
const HINTERGRUND_FRIST_MS = 5 * 60_000;

async function hintergrundAbwarten(boss: PgBoss, beginn: Date): Promise<void> {
  const ende = Date.now() + HINTERGRUND_FRIST_MS;
  for (;;) {
    const offen = (await boss.getBamEntries()).filter((eintrag) => eintrag.status !== 'completed');
    if (offen.length === 0) return;

    const gescheitert = offen.filter(
      (eintrag) =>
        eintrag.status === 'failed' && eintrag.completedOn && eintrag.completedOn >= beginn,
    );
    if (gescheitert.length > 0 || Date.now() > ende) {
      for (const eintrag of gescheitert.length > 0 ? gescheitert : offen) {
        console.error(
          `Hintergrund-Migration ${eintrag.name} (${eintrag.status}): ${eintrag.error ?? 'Frist abgelaufen'}`,
        );
        console.error(`  ${eintrag.command}`);
      }
      throw new Error('pg-boss: Hintergrund-Migrationen nicht fertig, Ausrollen angehalten.');
    }
    await new Promise((weiter) => setTimeout(weiter, 1000));
  }
}

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
  const boss = new PgBoss({ connectionString: verbindung, bamIntervalSeconds: 10 });
  boss.on('error', (fehler: Error) => console.error('[migration] pg-boss:', fehler.message));
  const beginn = new Date();
  await boss.start();
  try {
    await hintergrundAbwarten(boss, beginn);
  } finally {
    await boss.stop({ graceful: true, timeout: 30_000 });
  }

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
