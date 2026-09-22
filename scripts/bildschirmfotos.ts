import { spawnSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, type Page } from 'playwright';
import { rundgangGesehen } from '../e2e/rundgang-gesehen';

/*
 * Die Bilder für die Fallstudie, reproduzierbar statt von Hand:
 * Startseite, zwei Antworten in der Demo und die geöffnete Belegstelle.
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

/*
 * Genau zwei Fragen, zwei Bilder: eine, die in den Dokumenten steht, und
 * eine, bei der zwei Richtlinien Verschiedenes sagen. Mehr kostet nur Geld.
 */
const FRAGEN = [
  { datei: 'antwort-belegt.png', frage: 'Wer hilft beim Onboarding?' },
  { datei: 'antwort-widerspruch.png', frage: 'Wie lange werden Sicherungen aufbewahrt?' },
] as const;

/*
 * Aufgenommen wird in doppelter Auflösung und danach auf 1440 Pixel Breite
 * gerechnet: schärfer als direkt einfach aufgenommen, und ein Drittel der
 * Dateigrösse. `sips` gehört zu macOS; anderswo fällt der Schritt weg.
 */
function verkleinern(datei: string): void {
  const ergebnis = spawnSync('sips', ['-Z', '1440', datei, '--out', datei]);
  if (ergebnis.status !== 0) console.warn(`sips hat ${datei} nicht verkleinert.`);
}

async function ruhig(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  // Zwei Bilder warten: Das Urteilslicht blendet über Sekunden ein.
  await page.waitForTimeout(3500);
}

await mkdir(ZIEL, { recursive: true });
const browser = await chromium.launch();
try {
  const kontext = await browser.newContext({
    viewport: { width: 1440, height: 980 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
    locale: 'de-CH',
    storageState: rundgangGesehen(new URL(BASIS).origin),
  });
  const page = await kontext.newPage();

  await page.goto(`${BASIS}/`);
  await ruhig(page);
  await page.screenshot({ path: join(ZIEL, 'startseite.png') });
  verkleinern(join(ZIEL, 'startseite.png'));

  for (const { datei, frage } of FRAGEN) {
    await page.goto(`${BASIS}/demo`);
    await page.getByRole('button', { name: new RegExp(frage) }).click();
    await page.getByRole('button', { name: 'Neu beginnen' }).waitFor({ timeout: 120_000 });
    await ruhig(page);
    await page.screenshot({ path: join(ZIEL, datei) });
    verkleinern(join(ZIEL, datei));
  }

  // Die Stelle im Dokument, aus der letzten Antwort geöffnet.
  await page.locator('.blatt-knopf').first().click();
  await page.getByRole('dialog').waitFor();
  await ruhig(page);
  await page.screenshot({ path: join(ZIEL, 'beleg.png') });
  verkleinern(join(ZIEL, 'beleg.png'));

  console.log(`Vier Bilder in ${ZIEL}`);
} finally {
  await browser.close();
}
