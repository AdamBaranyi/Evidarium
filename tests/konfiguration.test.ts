import { describe, expect, it, vi } from 'vitest';

/*
 * Die Konfigurationsprüfung entscheidet, ob die Anwendung überhaupt startet.
 * Ein Fehler darin ist kein Schönheitsfehler, sondern ein Ausfall — und
 * er zeigt sich erst auf dem Server, wo niemand danebensteht.
 */

const PFLICHT = {
  DATABASE_URL: 'postgres://a:b@127.0.0.1:5432/c',
  SESSION_SECRET: 'mindestens-zweiunddreissig-zeichen-lang-fuer-den-test',
  APP_ORIGIN: 'http://localhost:3100',
  STORAGE_PATH: './storage-test',
};

/**
 * Frisch laden: `env.ts` liest `process.env` einmal beim Import.
 *
 * `vi.resetModules()` ist nötig, nicht Zierde — ohne den Zurücksetzer liefert
 * der zweite Aufruf das zwischengespeicherte Modul und wirft nie.
 */
async function laden(zusatz: Record<string, string>) {
  const alt = { ...process.env };
  vi.resetModules();
  Object.assign(process.env, PFLICHT, zusatz);
  try {
    const modul = (await import('@/lib/config/env')) as { env: Record<string, unknown> };
    return modul.env;
  } finally {
    for (const schluessel of Object.keys(process.env)) delete process.env[schluessel];
    Object.assign(process.env, alt);
  }
}

describe('Konfiguration', () => {
  it('nimmt eine leere Variable als nicht gesetzt', async () => {
    /*
     * `docker compose` setzt `${ANTHROPIC_API_KEY:-}` auch ohne Wert — als
     * leere Zeichenkette. Ohne diese Behandlung startet die Anwendung im
     * Demo-Modus nicht. Genau so im ersten Produktionslauf passiert.
     */
    const env = await laden({ AI_MODE: 'demo', ANTHROPIC_API_KEY: '', DATABASE_URL_OWNER: '' });
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(env.DATABASE_URL_OWNER).toBeUndefined();
    expect(env.AI_MODE).toBe('demo');
  });

  it('bricht bei AI_MODE=live ohne Schlüssel ab', async () => {
    await expect(laden({ AI_MODE: 'live', ANTHROPIC_API_KEY: '' })).rejects.toThrow(
      /ANTHROPIC_API_KEY/,
    );
  });

  it('bricht ab, wenn der Tagesdeckel über dem Monatsdeckel liegt', async () => {
    await expect(laden({ BUDGET_TAG_USD: '20', BUDGET_MONAT_USD: '10' })).rejects.toThrow(
      /Tagesdeckel/,
    );
  });

  it('verlangt in Produktion TRUST_PROXY, wenn die Demo läuft', async () => {
    await expect(
      laden({ DEMO_AKTIV: 'true', TRUST_PROXY: 'false', NODE_ENV: 'production' }),
    ).rejects.toThrow(/TRUST_PROXY/);
  });
});
