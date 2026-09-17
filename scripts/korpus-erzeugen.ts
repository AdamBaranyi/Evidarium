import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { BESPRECHUNGSNOTIZ, PDF_DOKUMENTE, PROJEKT_ATLAS, type PdfDokument } from '../eval/inhalte';

/*
 * Erzeugt den Evaluationskorpus aus den Inhalten in `eval/inhalte.ts`.
 *
 * Gerendert wird mit dem Chromium, das für die E2E-Tests ohnehin installiert
 * ist — kein zusätzliches PDF-Paket nur für Beispieldaten. Die Seitenumbrüche
 * stehen ausdrücklich im Markup (`break-after: page`), nicht im Zufall des
 * Textflusses: **Die Seitenzahlen sind die Erwartung der Evaluation**, sie
 * dürfen sich nicht ändern, weil ein Absatz eine Zeile länger wurde.
 *
 * Die erzeugten Dateien liegen im Repository. Dieses Skript ist die
 * Herkunftsangabe, nicht ein Schritt im Testlauf.
 *
 * Aufruf: bun scripts/korpus-erzeugen.ts
 */

const ZIEL = join(import.meta.dirname, '..', 'eval', 'korpus');

function alsHtml(dokument: PdfDokument): string {
  const seiten = dokument.seiten
    .map(
      (seite, i) => `
      <section class="seite">
        <h1>${dokument.titel}</h1>
        <h2>${seite.titel}</h2>
        ${seite.absaetze.map((absatz) => `<p>${absatz}</p>`).join('\n        ')}
        <footer>Seite ${i + 1} von ${dokument.seiten.length}</footer>
      </section>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="de-CH">
  <head>
    <meta charset="utf-8" />
    <title>${dokument.titel}</title>
    <style>
      @page { size: A4; margin: 20mm; }
      body { font-family: Georgia, 'Times New Roman', serif; font-size: 11pt; line-height: 1.5; }
      /* Der letzte Umbruch würde eine leere Seite anhängen. */
      .seite { break-after: page; }
      .seite:last-child { break-after: auto; }
      h1 { font-size: 16pt; margin: 0 0 2mm; }
      h2 { font-size: 13pt; margin: 0 0 6mm; font-weight: normal; }
      p { margin: 0 0 4mm; }
      footer { margin-top: 10mm; font-size: 9pt; color: #555; }
    </style>
  </head>
  <body>
${seiten}
  </body>
</html>`;
}

async function main(): Promise<void> {
  await mkdir(ZIEL, { recursive: true });

  const browser = await chromium.launch();
  try {
    const seite = await browser.newPage();

    for (const dokument of PDF_DOKUMENTE) {
      await seite.setContent(alsHtml(dokument), { waitUntil: 'load' });
      const bytes = await seite.pdf({ format: 'A4', printBackground: true });
      await writeFile(join(ZIEL, dokument.datei), bytes);
      console.log(`${dokument.datei} — ${dokument.seiten.length} Seiten`);
    }
  } finally {
    await browser.close();
  }

  for (const datei of [PROJEKT_ATLAS, BESPRECHUNGSNOTIZ]) {
    await writeFile(join(ZIEL, datei.datei), datei.text, 'utf8');
    console.log(datei.datei);
  }
}

await main();
