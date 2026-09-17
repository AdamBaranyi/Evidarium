import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { FAELLE, type Fall } from '../eval/faelle';
import { korpusLaden } from '../eval/laden';
import { fallPruefen } from '../eval/pruefen';
import { protokoll, type Zeile } from '../eval/protokoll';
import { frageBeantworten } from '@/lib/antwort/fragen';
import { kostenSchaetzen } from '@/lib/budget/preise';
import { queueStoppen } from '@/lib/jobs/queue';

/*
 * Führt die zwölf Prüffälle gegen den Korpus aus und schreibt das Protokoll.
 *
 *   bun --env-file=.env scripts/evaluieren.ts
 *
 * Läuft in `AI_MODE=demo` wie in `AI_MODE=live`; der Modus steht im
 * Protokoll. Ein Ergebnis aus dem Demo-Modus ist **keine** Aussage über das
 * Produkt, sondern nur über die Mechanik davor.
 *
 * `sessionId` bleibt leer: Das Kontingent von zehn Fragen je Anmeldung gilt
 * für Besucher, nicht für einen Prüflauf mit zwölf Fällen. Tages- und
 * Monatsdeckel greifen weiterhin.
 */

async function fallLaufen(
  userId: string,
  nachName: Map<string, string>,
  fall: Fall,
): Promise<Zeile> {
  const documentIds = fall.dokumente.map((datei) => {
    const id = nachName.get(datei);
    if (!id) throw new Error(`Dokument fehlt im Korpus: ${datei}`);
    return id;
  });

  const start = Date.now();
  const ergebnis = await frageBeantworten({
    userId,
    documentIds,
    frage: fall.frage,
    verlauf: fall.verlauf ?? [],
    sessionId: null,
  });
  const dauerMs = Date.now() - start;

  const verbrauch = ergebnis.art === 'antwort' ? ergebnis.verbrauch : null;
  const kostenUsd = verbrauch
    ? (kostenSchaetzen(verbrauch.modell, verbrauch.eingabeTokens, verbrauch.ausgabeTokens) ?? 0)
    : 0;

  return { fall, ergebnis, pruefung: fallPruefen(fall, ergebnis), dauerMs, kostenUsd };
}

async function main(): Promise<void> {
  /*
   * Einzelne Fälle als Argumente: `bun … scripts/evaluieren.ts E09 E10`.
   * Gedacht fürs Nachstellen eines gescheiterten Falls, ohne die anderen elf
   * noch einmal zu bezahlen. Ohne Argument läuft der ganze Satz.
   */
  const wahl = process.argv.slice(2).map((wert) => wert.toUpperCase());
  const auswahl = wahl.length === 0 ? FAELLE : FAELLE.filter((f) => wahl.includes(f.id));
  if (auswahl.length === 0) throw new Error(`Kein Fall passt zu: ${wahl.join(', ')}`);

  console.log(`Korpus laden …`);
  const { userId, dokumente } = await korpusLaden();
  const nachName = new Map(dokumente.map((d) => [d.datei, d.documentId]));
  console.log(`${dokumente.length} Dokumente bereit.\n`);

  const zeilen: Zeile[] = [];
  for (const fall of auswahl) {
    const zeile = await fallLaufen(userId, nachName, fall);
    zeilen.push(zeile);
    const stand = zeile.pruefung.bestanden ? 'ok        ' : 'GESCHEITERT';
    console.log(
      `${zeile.fall.id} ${stand} ${zeile.pruefung.kategorie.padEnd(18)} ${(zeile.dauerMs / 1000).toFixed(1)} s`,
    );
    for (const mangel of zeile.pruefung.maengel) console.log(`      ${mangel}`);
  }

  const ziel = join(import.meta.dirname, '..', 'docs', 'EVALUATION.md');
  await writeFile(
    ziel,
    protokoll(
      zeilen,
      dokumente.map((d) => d.datei),
    ),
    'utf8',
  );

  const bestanden = zeilen.filter((z) => z.pruefung.bestanden).length;
  console.log(`${bestanden} von ${zeilen.length} bestanden.`);

  await queueStoppen();
  // Der Datenbankpool hält den Prozess sonst offen.
  process.exit(bestanden === zeilen.length ? 0 : 1);
}

await main();
