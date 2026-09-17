import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

/*
 * Tests laufen gegen die Testdatenbank, nie gegen die Entwicklungsdatenbank:
 * Ein undichtes Teardown hinterliesse sonst Datensätze neben den eigenen
 * Daten. DATABASE_URL wird darum für die Testläufe überschrieben.
 */
const testUrl = process.env.TEST_DATABASE_URL ?? '';

// Erzeugt statt hingeschrieben: Ein fester hochentropischer Wert neben dem
// Namen SESSION_SECRET ist für einen Secret-Scanner nicht von einem echten
// Geheimnis zu unterscheiden. Die Tests brauchen nur irgendeinen gültigen Wert.
const testGeheimnis = process.env.SESSION_SECRET ?? randomBytes(36).toString('base64');

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
    globalSetup: ['./tests/setup-datenbank.ts'],
    /*
     * Vollständig, nicht ergänzend: Die Tests dürfen nicht davon abhängen,
     * dass jemand vorher `.env` eingelesen hat. Sonst laufen sie lokal grün
     * und scheitern in der CI an einer Variablen, die dort niemand setzt —
     * genau so passiert am 17.09.2026 mit STORAGE_PATH.
     *
     * Jede Pflichtvariable aus src/lib/config/env.ts gehört hierher.
     */
    env: {
      DATABASE_URL: testUrl,
      SESSION_SECRET: testGeheimnis,
      APP_ORIGIN: 'http://localhost:3100',
      STORAGE_PATH: './storage-test',
    },
    // Die Tests teilen sich eine Datenbank; parallele Dateien stolpern sonst
    // über die Zeilen der jeweils anderen.
    fileParallelism: false,
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
