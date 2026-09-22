import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, type Page } from 'playwright';
import { rundgangGesehen } from '../e2e/rundgang-gesehen';

/*
 * Die drei Bilder für die Fallstudie, reproduzierbar statt von Hand:
 * Startseite, eine Antwort in der Demo und der geöffnete Beleg.
 *
 *   bun scripts/bildschirmfotos.ts [basis-url] [zielordner]
 *
 * Standard: `http://localhost:3100`, Ziel `docs/bilder`. Die Demo muss
 * eingeschaltet und befüllt sein. Für die Bilder der Fallstudie zwei Dinge:
 * ein Produktionsbuild (`next start`), sonst steht das Symbol des
 * Entwicklungsservers im Bild; und der Live-Modus, sonst zeigt die Antwort
 * nur die passendste Stelle statt eines Urteils (zwei Fragen, rund ein
 * Rappen).
 */

const BASIS = process.argv[2] ?? 'http://localhost:3100';
const ZIEL = process.argv[3] ?? join(import.meta.dirname, '..', 'docs', 'bilder');
const FRAGE = 'Wie lange werden Sicherungen aufbewahrt?';

async function ruhig(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  // Zwei Bilder warten: Das Urteilslicht blendet über Sekunden ein.
  await page.waitForTimeout(3500);
}

await mkdir(ZIEL, { recursive: true });
const browser = await chromium.launch();
try {
  const kontext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
    locale: 'de-CH',
    storageState: rundgangGesehen(new URL(BASIS).origin),
  });
  const page = await kontext.newPage();

  await page.goto(`${BASIS}/`);
  await ruhig(page);
  await page.screenshot({ path: join(ZIEL, 'startseite.png') });

  await page.goto(`${BASIS}/demo`);
  await page.getByRole('button', { name: new RegExp(FRAGE) }).click();
  await page.getByRole('button', { name: 'Neu beginnen' }).waitFor({ timeout: 60_000 });
  await ruhig(page);
  await page.screenshot({ path: join(ZIEL, 'antwort.png') });

  await page.locator('.blatt-knopf').first().click();
  await page.getByRole('dialog').waitFor();
  await ruhig(page);
  await page.screenshot({ path: join(ZIEL, 'beleg.png') });

  console.log(`Drei Bilder in ${ZIEL}`);
} finally {
  await browser.close();
}
