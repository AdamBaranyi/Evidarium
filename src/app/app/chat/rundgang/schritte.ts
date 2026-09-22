/*
 * Die Schritte des Rundgangs, je Ort in ihrer Reihenfolge.
 *
 * Ein Schritt zeigt auf ein Element mit `data-rundgang="…"`; das erste
 * sichtbare Ziel gilt, sonst steht die Karte in der Mitte. Mehrere Ziele,
 * weil die Seitenspalte unter Schreibtischbreite hinter dem Knopf
 * «Dokumente» liegt — dann zeigt der Schritt auf den Knopf.
 *
 * `wenn`: Gibt es nichts zu zeigen, fällt der Schritt weg. Mitten im
 * Gespräch etwa stehen keine Einstiegsfragen mehr da, und ein Text über sie
 * wäre falsch; dann erklärt der Schritt das Eingabefeld, und das Urteil
 * zeigt er an der Antwort statt an der Legende.
 */

export type Ort = 'demo' | 'app';

export type SchrittId =
  | 'willkommenDemo'
  | 'willkommen'
  | 'korpus'
  | 'hochladen'
  | 'auswahl'
  | 'vorschlaege'
  | 'fragen'
  | 'urteile'
  | 'eigene'
  | 'ende';

type Vorhanden = (ziel: string) => boolean;

export type Schritt = {
  id: SchrittId;
  ziele: readonly string[];
  wenn?: (da: Vorhanden) => boolean;
};

const urteilDa = (da: Vorhanden) => da('legende') || da('urteil');

const SCHRITTE: Record<Ort, readonly Schritt[]> = {
  demo: [
    { id: 'willkommenDemo', ziele: [] },
    { id: 'korpus', ziele: ['dokumente', 'seitenspalte'] },
    { id: 'vorschlaege', ziele: ['vorschlaege'], wenn: (da) => da('vorschlaege') },
    { id: 'fragen', ziele: ['eingabe'], wenn: (da) => !da('vorschlaege') && da('eingabe') },
    { id: 'urteile', ziele: ['legende', 'urteil'], wenn: urteilDa },
    { id: 'eigene', ziele: ['eigene-dateien', 'seitenspalte'], wenn: (da) => da('eigene-dateien') },
    { id: 'ende', ziele: ['rundgang'] },
  ],
  app: [
    { id: 'willkommen', ziele: [] },
    { id: 'hochladen', ziele: ['nav-dokumente'] },
    { id: 'auswahl', ziele: ['seite', 'seitenspalte'] },
    { id: 'fragen', ziele: ['eingabe'], wenn: (da) => da('eingabe') },
    { id: 'urteile', ziele: ['legende', 'urteil'], wenn: urteilDa },
    { id: 'ende', ziele: ['rundgang'] },
  ],
};

/** Die Schritte, die an diesem Ort gerade etwas zu zeigen haben. */
export function schritteFuer(ort: Ort, da: Vorhanden): Schritt[] {
  return SCHRITTE[ort].filter((schritt) => !schritt.wenn || schritt.wenn(da));
}

export const rundgangSchluessel = (ort: Ort) => `evidarium.rundgang.${ort}`;
