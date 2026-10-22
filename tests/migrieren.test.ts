import { spawnSync } from 'node:child_process';
import { Pool } from 'pg';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

/*
 * scripts/migrieren.ts läuft beim Ausrollen als Eigentümer. pg-boss lässt nach
 * einem Update manche Index-Bauten im Hintergrund (BAM) für «die nächste
 * Instanz mit migrate». Live sind das Web und Worker als Anwendungsrolle, und
 * die darf auf Tabellen des Eigentümers keine Indizes bauen («must be owner of
 * table», nachgestellt am 21.10.2026). Die Migration baut sie darum selbst
 * fertig und hält das Ausrollen an, wenn ein Bau scheitert.
 */
const url = process.env.TEST_DATABASE_URL ?? '';
const pool = new Pool({ connectionString: url });
const PROBE = 'bam_probe_build';
// Im Schema von pg-boss wie die echten Bauten: Ab 12.38 prüft pg-boss nach dem
// Bau, ob der Index dort existiert.

function migrieren() {
  return spawnSync('bun', ['scripts/migrieren.ts'], {
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH ?? '',
      HOME: process.env.HOME ?? '',
      NODE_ENV: 'test',
      DATABASE_URL_OWNER: url,
    },
    timeout: 150_000,
  });
}

async function eintragen(status: string, command: string, abgeschlossen: string | null = null) {
  const { rows } = await pool.query<{ version: number }>('SELECT version FROM pgboss.version');
  await pool.query(
    `INSERT INTO pgboss.bam (name, version, status, table_name, command, error, completed_on)
     VALUES ($1, $2, $3, 'bam_probe', $4, $5, $6)`,
    [
      PROBE,
      rows[0]?.version,
      status,
      command,
      status === 'failed' ? 'must be owner of table bam_probe' : null,
      abgeschlossen,
    ],
  );
}

async function zustand(): Promise<string | undefined> {
  const { rows } = await pool.query<{ status: string }>(
    'SELECT status FROM pgboss.bam WHERE name = $1',
    [PROBE],
  );
  return rows[0]?.status;
}

beforeAll(async () => {
  // Wie live gibt es die Anwendungsrolle; in der CI legt der Test sie an.
  await pool.query(
    `DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'evidarium_app') THEN CREATE ROLE evidarium_app; END IF; END $$`,
  );
  const erster = migrieren();
  expect(erster.status, erster.stderr).toBe(0);
  await pool.query('CREATE TABLE IF NOT EXISTS pgboss.bam_probe (id int)');
}, 180_000);

afterEach(async () => {
  await pool.query('DELETE FROM pgboss.bam WHERE name = $1', [PROBE]);
  await pool.query('DROP INDEX IF EXISTS pgboss.bam_probe_i1');
});

afterAll(async () => {
  await pool.query('DROP TABLE IF EXISTS pgboss.bam_probe');
  await pool.end();
});

const INDEX = 'CREATE INDEX CONCURRENTLY IF NOT EXISTS bam_probe_i1 ON pgboss.bam_probe (id)';

describe('scripts/migrieren.ts und die Hintergrund-Migrationen von pg-boss', () => {
  it('baut einen offenen Hintergrund-Index fertig, bevor der Lauf endet', async () => {
    await eintragen('pending', INDEX);

    const lauf = migrieren();

    expect(lauf.status, lauf.stderr).toBe(0);
    expect(await zustand()).toBe('completed');
    const index = await pool.query(
      "SELECT 1 FROM pg_indexes WHERE schemaname = 'pgboss' AND indexname = 'bam_probe_i1'",
    );
    expect(index.rowCount).toBe(1);
  }, 180_000);

  it('holt einen Bau nach, an dem früher die Anwendungsrolle scheiterte', async () => {
    await eintragen('failed', INDEX, new Date(Date.now() - 3_600_000).toISOString());

    const lauf = migrieren();

    expect(lauf.status, lauf.stderr).toBe(0);
    expect(await zustand()).toBe('completed');
  }, 180_000);

  it('hält das Ausrollen an, wenn ein Bau auch als Eigentümer scheitert', async () => {
    await eintragen(
      'pending',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS bam_probe_i1 ON public.gibt_es_nicht (id)',
    );

    const lauf = migrieren();

    expect(lauf.status).not.toBe(0);
    expect(lauf.stderr).toContain(PROBE);
  }, 180_000);
});
