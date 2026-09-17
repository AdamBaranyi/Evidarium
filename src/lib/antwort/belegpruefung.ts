import type { Aussage, Kategorie, Modellantwort } from './schema';

/*
 * **Die Belegprüfung ist der Kern dieses Produkts.**
 *
 * Ohne sie kann das Modell eine Fundstelle erfinden, die gut aussieht und
 * falsch ist — und niemand merkt es, weil die Antwort plausibel klingt und
 * eine Quellenangabe trägt. Mit ihr ist das unmöglich: Was diese Prüfung
 * nicht besteht, wird nicht angezeigt.
 *
 * Geprüft werden zwei Dinge, beide hart:
 *   1. Jede `sourceId` stammt aus der Menge, die tatsächlich übermittelt wurde.
 *   2. Jedes Zitat kommt nach Normalisierung wörtlich im zugehörigen Abschnitt vor.
 */

export type Abschnitt = {
  sourceId: string;
  text: string;
  documentId: string;
  filename: string;
  page: number | null;
  lineStart: number | null;
  lineEnd: number | null;
};

/** Ein Beleg, wie er angezeigt wird — mit Metadaten **vom Server**, nicht vom Modell. */
export type GeprüfterBeleg = {
  sourceId: string;
  zitat: string;
  documentId: string;
  filename: string;
  page: number | null;
  lineStart: number | null;
  lineEnd: number | null;
};

export type GeprüfteAussage = {
  text: string;
  belege: GeprüfterBeleg[];
};

export type Befund =
  | { art: 'unbekannte_quelle'; sourceId: string }
  | { art: 'zitat_nicht_gefunden'; sourceId: string; zitat: string }
  | { art: 'aussage_ohne_beleg'; text: string }
  | { art: 'kategorie_widerspricht_belegen'; kategorie: Kategorie };

export type Pruefergebnis =
  | { gueltig: true; kategorie: Kategorie; aussagen: GeprüfteAussage[] }
  | { gueltig: false; befunde: Befund[] };

/**
 * Normalisierung für den Zitatvergleich — **die Definition, auf die sich
 * alles andere beruft.**
 *
 * Sie ist absichtlich eng gehalten. Jede zusätzliche Grosszügigkeit hier
 * schwächt die Prüfung: Wer etwa Gross- und Kleinschreibung ignoriert, lässt
 * ein Zitat durch, das im Original anders betont war.
 *
 * Erlaubt wird nur, was beim Extrahieren aus einem PDF ohnehin entsteht:
 *
 * - **Unicode-Normalform NFC** — Dateien vom Mac liefern zerlegte Umlaute
 *   (`u` + Trema); dasselbe Wort sähe sonst je nach Herkunft verschieden aus.
 * - **Whitespace zusammenfassen** — PDF-Extraktion erzeugt beliebige Folgen
 *   aus Leerzeichen, Zeilenumbrüchen und geschützten Leerzeichen.
 * - **Typografische Anführungs- und Bindestriche vereinheitlichen** — ein PDF
 *   setzt sie, das Modell gibt oft die geraden Varianten zurück.
 *
 * Nicht erlaubt: Kleinschreibung, Entfernen von Satzzeichen, Ähnlichkeitsmass.
 */
export function normalisieren(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[‐-―−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Prüft eine Modellantwort gegen die Abschnitte, die dem Modell übermittelt
 * wurden.
 *
 * Gibt entweder die geprüfte Antwort zurück — mit Metadaten aus den
 * Abschnitten, nie aus der Modellausgabe — oder die Liste der Befunde.
 */
export function belegePruefen(antwort: Modellantwort, uebermittelt: Abschnitt[]): Pruefergebnis {
  const nachId = new Map(uebermittelt.map((a) => [a.sourceId, a]));
  const normalisiert = new Map(uebermittelt.map((a) => [a.sourceId, normalisieren(a.text)]));

  const befunde: Befund[] = [];
  const geprueft: GeprüfteAussage[] = [];

  for (const aussage of antwort.aussagen) {
    const belege: GeprüfterBeleg[] = [];

    for (const beleg of aussage.belege) {
      const abschnitt = nachId.get(beleg.sourceId);

      // 1. Stammt die Quelle aus der übermittelten Menge?
      if (!abschnitt) {
        befunde.push({ art: 'unbekannte_quelle', sourceId: beleg.sourceId });
        continue;
      }

      // 2. Steht das Zitat wirklich dort?
      const heuhaufen = normalisiert.get(beleg.sourceId) ?? '';
      if (!heuhaufen.includes(normalisieren(beleg.zitat))) {
        befunde.push({
          art: 'zitat_nicht_gefunden',
          sourceId: beleg.sourceId,
          zitat: beleg.zitat,
        });
        continue;
      }

      // Metadaten kommen aus dem Abschnitt, nicht aus der Modellausgabe.
      belege.push({
        sourceId: beleg.sourceId,
        zitat: beleg.zitat,
        documentId: abschnitt.documentId,
        filename: abschnitt.filename,
        page: abschnitt.page,
        lineStart: abschnitt.lineStart,
        lineEnd: abschnitt.lineEnd,
      });
    }

    geprueft.push({ text: aussage.text, belege });
  }

  befunde.push(...kategoriePruefen(antwort.kategorie, antwort.aussagen, geprueft));

  if (befunde.length > 0) return { gueltig: false, befunde };
  return { gueltig: true, kategorie: antwort.kategorie, aussagen: geprueft };
}

/**
 * Die Kategorie muss zu den Belegen passen.
 *
 * Ohne diese Prüfung könnte das Modell «belegt» sagen und dabei Aussagen ohne
 * jeden Beleg liefern — die Kategorie wäre dann Dekoration.
 */
function kategoriePruefen(
  kategorie: Kategorie,
  roh: Aussage[],
  geprueft: GeprüfteAussage[],
): Befund[] {
  const befunde: Befund[] = [];

  if (kategorie === 'keine_grundlage') {
    // Kein Beleg zu haben ist hier kein Fehler, sondern die Aussage selbst.
    return befunde;
  }

  if (roh.length === 0) {
    return [{ art: 'kategorie_widerspricht_belegen', kategorie }];
  }

  const ohneBeleg = geprueft.filter((a) => a.belege.length === 0);

  if (kategorie === 'belegt' && ohneBeleg.length > 0) {
    // «Belegt» heisst: jede einzelne Aussage ist gedeckt.
    befunde.push(...ohneBeleg.map((a) => ({ art: 'aussage_ohne_beleg' as const, text: a.text })));
  }

  if (
    (kategorie === 'teilweise_belegt' || kategorie === 'widerspruch') &&
    geprueft.every((a) => a.belege.length === 0)
  ) {
    // Auch diese Kategorien brauchen mindestens einen gültigen Beleg —
    // sonst ist es «keine Grundlage» und sollte so heissen.
    befunde.push({ art: 'kategorie_widerspricht_belegen', kategorie });
  }

  return befunde;
}
