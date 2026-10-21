import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';

/*
 * Live laufen Web und Worker als Anwendungsrolle. Migrationen und die
 * Hintergrund-Bauten von pg-boss brauchen den Eigentümer und laufen darum nur
 * in scripts/migrieren.ts. Mit `migrate` versuchten Web und Worker sie trotzdem
 * und scheiterten bei jedem Takt mit «must be owner of table» (21.10.2026).
 */
const optionen: Record<string, unknown>[] = [];

vi.mock('pg-boss', () => ({
  PgBoss: class {
    constructor(werte: Record<string, unknown>) {
      optionen.push(werte);
    }
    on() {}
    async start() {}
    async createQueue() {}
  },
}));

async function queueStarten(zusatz: Record<string, string>) {
  const alt = { ...process.env };
  vi.resetModules();
  Object.assign(process.env, zusatz);
  try {
    const { queue } = await import('@/lib/jobs/queue');
    await queue();
    return optionen.at(-1);
  } finally {
    for (const schluessel of Object.keys(process.env)) delete process.env[schluessel];
    Object.assign(process.env, alt);
  }
}

afterEach(() => {
  optionen.length = 0;
});

describe('pg-boss als Anwendungsrolle', () => {
  it('migriert nicht, wenn PGBOSS_MIGRIEREN=false', async () => {
    expect((await queueStarten({ PGBOSS_MIGRIEREN: 'false' }))?.migrate).toBe(false);
  });

  it('migriert ohne Angabe wie bisher, für Entwicklung und CI', async () => {
    expect((await queueStarten({}))?.migrate).toBe(true);
  });

  it('bricht bei einem Tippfehler ab, statt still zu migrieren', async () => {
    await expect(queueStarten({ PGBOSS_MIGRIEREN: 'nein' })).rejects.toThrow('PGBOSS_MIGRIEREN');
  });

  it('die Produktion schaltet es für Web und Worker ab', () => {
    const compose = readFileSync('infra/compose.prod.yml', 'utf8');
    for (const dienst of ['web', 'worker']) {
      const block =
        compose.split(new RegExp(`^  ${dienst}:\\n`, 'm'))[1]?.split(/^ {2}[a-z]+:\n/m)[0] ?? '';
      expect(block, `${dienst} in infra/compose.prod.yml`).toMatch(
        /^\s+PGBOSS_MIGRIEREN: 'false'$/m,
      );
    }
  });
});
