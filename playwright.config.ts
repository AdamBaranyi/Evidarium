import { defineConfig, devices } from '@playwright/test';

/*
 * Drei Prüfbreiten: 320 (kleinstes Telefon, harte Vorgabe), 768 (Tablet),
 * 1440 (Schreibtisch). Browser-Emulation ist kein Beweis für ein bestimmtes
 * Gerät — geprüft wird das Layout, nicht das Telefon.
 */
/*
 * Port über `PW_PORT` wählbar: So läuft ein Produktionsbuild zum Prüfen neben
 * einem Entwicklungsserver auf 3100, ohne ihn zu stören.
 */
const PORT = Number(process.env.PW_PORT ?? 3100);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Alle Läufer teilen sich in der CI eine IP; das Login-Rate-Limit greift
  // sonst quer durch die Tests.
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'de-CH',
    timezoneId: 'Europe/Zurich',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'schmal-320',
      use: { ...devices['Desktop Chrome'], viewport: { width: 320, height: 568 } },
    },
    {
      name: 'mittel-768',
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'breit-1440',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    // In der CI hat der Build-Schritt davor schon gebaut; ein zweiter Build
    // kostet nur Zeit.
    command: process.env.CI
      ? `bunx next start --port ${PORT}`
      : `bun run build && bunx next start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
