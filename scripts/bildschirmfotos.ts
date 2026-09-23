import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { Pool } from 'pg';
import { chromium, type Browser, type Page } from 'playwright';
import { rundgangGesehen } from '../e2e/rundgang-gesehen';

/*
 * Die Bilder für die Fallstudie, reproduzierbar statt von Hand:
 * Startseite, zwei Antworten in der Demo und die geöffnete Belegstelle.
 *
 *   bun scripts/bildschirmfotos.ts [basis-url] [zielordner] [teil]
 *
 * `teil` ist `alles` (Vorgabe) oder `angemeldet` — der angemeldete Bereich
 * allein kostet nichts, die öffentlichen Bilder zwei Fragen ans Modell.
 *
 * Der angemeldete Bereich kommt dazu, wenn `DATABASE_URL` gesetzt ist: Das
 * Skript legt für `EVIDARIUM_FOTO_KONTO` (Vorgabe: das Demo-Konto) kurz eine
 * Sitzung an und entfernt sie danach wieder. Das Konto sollte Dokumente,
 * ein, zwei Projekte und ein paar Aufrufe haben, sonst zeigen die Bilder
 * leere Seiten.
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
const NUR_ANGEMELDET = process.argv[4] === 'angemeldet';

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

  if (!NUR_ANGEMELDET) {
    await oeffentlich(page);
  }
  await angemeldet(browser);
  console.log(`Bilder in ${ZIEL}`);
} finally {
  await browser.close();
}

/* Startseite und Demo: die zwei Fragen ans Modell stecken hier. */
async function oeffentlich(page: Page): Promise<void> {
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
}

/*
 * Dokumente mit Projekten und die Verbrauchsseite. Ohne Anmeldung sieht
 * niemand diesen Teil — darum gehört er in die Fallstudie.
 */
async function angemeldet(browser: Browser): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log('DATABASE_URL fehlt: der angemeldete Bereich bleibt aus.');
    return;
  }
  const konto = process.env.EVIDARIUM_FOTO_KONTO ?? 'demo@nordstern.test';
  const pool = new Pool({ connectionString: url });
  const sitzung = randomBytes(32).toString('base64url');
  try {
    const nutzer = await pool.query<{ id: string }>('select id from users where email = $1', [
      konto,
    ]);
    const id = nutzer.rows[0]?.id;
    if (!id) throw new Error(`Konto ${konto} gibt es nicht.`);
    await pool.query(
      `insert into sessions (id, user_id, expires_at) values ($1, $2, now() + interval '20 minutes')`,
      [sitzung, id],
    );

    // Niedriger als die öffentlichen Bilder: Diese Seiten sind kurz, und
    // eine halbe Seite Leere darunter sagt nichts.
    const kontext = await browser.newContext({
      viewport: { width: 1440, height: 760 },
      deviceScaleFactor: 2,
      colorScheme: 'dark',
      locale: 'de-CH',
      storageState: rundgangGesehen(new URL(BASIS).origin),
    });
    await kontext.addCookies([
      { name: 'evidarium_session', value: sitzung, url: BASIS, httpOnly: true, sameSite: 'Lax' },
    ]);
    const page = await kontext.newPage();

    for (const [pfad, datei] of [
      ['/app/documents', 'dokumente.png'],
      ['/app/usage', 'verbrauch.png'],
    ] as const) {
      await page.goto(`${BASIS}${pfad}`);
      await ruhig(page);
      await page.screenshot({ path: join(ZIEL, datei) });
      verkleinern(join(ZIEL, datei));
    }
  } finally {
    await pool.query('delete from sessions where id = $1', [sitzung]);
    await pool.end();
  }
}
