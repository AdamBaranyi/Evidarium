import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/*
 * Tests laufen gegen die Testdatenbank, nie gegen die Entwicklungsdatenbank:
 * Ein undichtes Teardown hinterliesse sonst Datensätze neben den eigenen
 * Daten. DATABASE_URL wird darum für die Testläufe überschrieben.
 */
const testUrl = process.env.TEST_DATABASE_URL ?? '';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
    globalSetup: ['./tests/setup-datenbank.ts'],
    env: {
      DATABASE_URL: testUrl,
      SESSION_SECRET: 'nur-fuer-tests-nicht-geheim-mindestens-32-zeichen',
      APP_ORIGIN: 'http://localhost:3100',
    },
    // Die Tests teilen sich eine Datenbank; parallele Dateien stolpern sonst
    // über die Zeilen der jeweils anderen.
    fileParallelism: false,
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
