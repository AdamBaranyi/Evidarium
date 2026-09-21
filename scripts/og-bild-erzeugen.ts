import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

/*
 * Erzeugt das Vorschaubild für geteilte Links (1200 × 630).
 *
 * Mit den eigenen Schriften und im eigenen Material, gerendert vom Chromium
 * der Browsertests — dasselbe Verfahren wie beim Evaluationskorpus. `next/og`
 * wäre die naheliegende Wahl, liest aber kein WOFF2; die Schriften müssten
 * dafür in einem zweiten Format ins Repository.
 *
 * Aufruf: bun scripts/og-bild-erzeugen.ts
 */

const WURZEL = join(import.meta.dirname, '..');

/*
 * Schriften als `data:`-Adresse eingebettet, nicht als `file://`.
 *
 * Eine Seite aus `setContent` hat den Ursprung `about:blank` und darf keine
 * `file://`-Schriften laden. Die erste Fassung tat das — der Browser fiel
 * still auf Times und Helvetica zurück, und das Bild sah fast richtig aus.
 */
async function schrift(datei: string): Promise<string> {
  const bytes = await readFile(join(WURZEL, 'public', 'schriften', datei));
  return `data:font/woff2;base64,${bytes.toString('base64')}`;
}
const ARCHIVO = await schrift('archivo-latin.woff2');
const SERIF = await schrift('source-serif-4-latin.woff2');

const HTML = `<!doctype html>
<html lang="de-CH"><head><meta charset="utf-8"><style>
  @font-face { font-family: Archivo; src: url('${ARCHIVO}'); font-weight: 400 700; }
  @font-face { font-family: 'Source Serif 4'; src: url('${SERIF}'); font-weight: 400 600; }
  body { margin: 0; width: 1200px; height: 630px; background: #23211e; color: #ece8e1;
         font-family: Archivo, sans-serif; display: grid; grid-template-columns: 1.05fr 0.95fr;
         align-items: center; gap: 56px; padding: 0 72px; box-sizing: border-box;
         background-image: radial-gradient(70% 60% at 15% 0%, rgba(255,250,238,.08), transparent 65%); }
  .marke { font-family: 'Source Serif 4', serif; font-size: 40px; margin: 0 0 28px; }
  h1 { font-size: 58px; line-height: 1.08; margin: 0; letter-spacing: -0.01em; }
  .unter { color: #aaa49a; font-size: 26px; margin-top: 24px; line-height: 1.4; }
  .aussage { display: flex; gap: 14px; font-size: 24px; margin-bottom: 18px; }
  .balken { width: 4px; background: #79c295; }
  .blatt { background: #f7f2e6; color: #5f594c; border-radius: 3px; padding: 26px 28px;
           font-family: 'Source Serif 4', serif; font-size: 23px; line-height: 1.55;
           box-shadow: 0 30px 60px -24px rgba(0,0,0,.8); }
  .kopf { display: flex; justify-content: space-between; border-bottom: 1px solid #d9cfb8;
          padding-bottom: 10px; margin-bottom: 14px; }
  mark { background: #e3d7b4; color: #23211e; }
</style></head><body>
  <div>
    <p class="marke">Evidarium</p>
    <h1>Antworten aus deinen Dokumenten, mit Quellen zum Nachlesen.</h1>
    <p class="unter">Jede Aussage trägt ein wörtliches Zitat.</p>
  </div>
  <div>
    <div class="aussage"><span class="balken"></span><span>Beim Onboarding hilft Mara Keller.</span></div>
    <div class="blatt">
      <div class="kopf"><span>Teamhandbuch.pdf</span><span>2</span></div>
      Die ersten beiden Wochen sind als Einarbeitung geplant. <mark>Beim Onboarding hilft Mara Keller.</mark>
      Zugaenge werden vor dem ersten Arbeitstag vorbereitet.
    </div>
  </div>
</body></html>`;

const browser = await chromium.launch();
try {
  const seite = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await seite.setContent(HTML, { waitUntil: 'load' });
  await seite.evaluate(() => document.fonts.ready);
  const geladen = await seite.evaluate(() =>
    ['Archivo', 'Source Serif 4'].map((f) => document.fonts.check(`20px "${f}"`)),
  );
  if (geladen.includes(false)) throw new Error(`Schrift nicht geladen: ${JSON.stringify(geladen)}`);
  const bild = await seite.screenshot({ type: 'png' });
  await writeFile(join(WURZEL, 'src', 'app', 'opengraph-image.png'), bild);
  await writeFile(
    join(WURZEL, 'src', 'app', 'opengraph-image.alt.txt'),
    'Evidarium: eine Aussage mit ihrem Beleg aus dem Teamhandbuch, Seite 2, das Zitat markiert.',
  );
  console.log('opengraph-image.png geschrieben');
} finally {
  await browser.close();
}
