import { existsSync } from 'node:fs';
import { screenReaderConfig } from '@guidepup/playwright';
import { defineConfig, devices } from '@playwright/test';
import { pruefserver } from './e2e/pruefserver';
import { rundgangGesehen } from './e2e/rundgang-gesehen';

if (existsSync('.env')) process.loadEnvFile('.env');

/*
 * Tests mit einem echten Screenreader: VoiceOver, gesteuert von Guidepup,
 * mit Safari (WebKit), wie ein Mensch mit VoiceOver am Mac es benutzt.
 *
 * Nur auf macOS, und dort nur auf einem Rechner, auf dem VoiceOver sich
 * fernsteuern lässt: in der CI (`.github/workflows/screenreader.yml`,
 * eingerichtet von Guidepup). Auf dem Entwicklungsrechner nicht — das
 * verlangte Eingriffe in die Systemeinstellungen, und der Rechner gehört
 * nicht dem Projekt.
 *
 * Ein Screenreader läuft nur einmal: ein Test nach dem anderen, im
 * sichtbaren Fenster (headless hört VoiceOver nichts).
 */
const PORT = Number(process.env.PW_PORT ?? 3100);

export default defineConfig({
  ...screenReaderConfig,
  testDir: './screenreader',
  timeout: 5 * 60 * 1000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    storageState: rundgangGesehen(`http://localhost:${PORT}`),
    locale: 'de-CH',
    timezoneId: 'Europe/Zurich',
    // Die Vorführung auf der Startseite steht still; sonst redet sie dazwischen.
    contextOptions: { reducedMotion: 'reduce' },
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'voiceover-safari',
      use: { ...devices['Desktop Safari'], headless: false },
    },
  ],
  webServer: pruefserver(PORT),
});
