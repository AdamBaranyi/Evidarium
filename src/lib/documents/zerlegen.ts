import type { Textstelle } from './extrahieren';

/**
 * Ein fertiger Abschnitt, wie er in die Datenbank geht.
 */
export type Abschnitt = {
  ordinal: number;
  page: number | null;
  lineStart: number | null;
  lineEnd: number | null;
  text: string;
};

/*
 * Zielgrösse in Zeichen, nicht in Token: Die Zählung soll ohne Modell
 * funktionieren und für Deutsch wie Englisch dieselbe Grenze ergeben.
 * Als grobe Umrechnung gilt rund vier Zeichen je Token — 1200 Zeichen sind
 * also grössenordnungsmässig 300 Token.
 */
const ZIEL_ZEICHEN = 1200;
const UEBERLAPPUNG_ZEICHEN = 200;
const MINDEST_ZEICHEN = 80;

/**
 * Teilt einen langen Text an Satzgrenzen, mit Überlappung.
 *
 * Die Überlappung fängt den Fall ab, dass eine Aussage genau an der
 * Schnittkante steht: Ohne sie fände die Suche den halben Satz auf der einen
 * Seite und den halben auf der anderen, und keiner von beiden trägt die
 * Antwort.
 */
function teile(text: string): string[] {
  if (text.length <= ZIEL_ZEICHEN) return [text];

  const saetze = text.split(/(?<=[.!?])\s+/);
  const teile: string[] = [];
  let aktuell = '';

  for (const satz of saetze) {
    if (aktuell !== '' && aktuell.length + satz.length + 1 > ZIEL_ZEICHEN) {
      teile.push(aktuell);
      const schwanz = aktuell.slice(-UEBERLAPPUNG_ZEICHEN);
      const schnitt = schwanz.indexOf(' ');
      aktuell = schnitt === -1 ? '' : schwanz.slice(schnitt + 1);
    }
    aktuell = aktuell === '' ? satz : `${aktuell} ${satz}`;
  }

  if (aktuell.trim() !== '') teile.push(aktuell);
  return teile;
}

/**
 * Macht aus den Textstellen die Abschnitte für die Datenbank.
 *
 * **Dateiname und Titel kommen bewusst in den Abschnittstext.** Wer nur
 * Inhalt einbettet, findet ein Dokument später nicht über seinen Namen —
 * eine Frage wie «Was steht im Supportprozess?» trifft dann nichts, obwohl
 * genau dieses Dokument gemeint ist.
 */
export function zerlegen(stellen: Textstelle[], dateiname: string): Abschnitt[] {
  const abschnitte: Abschnitt[] = [];
  let ordinal = 0;

  for (const stelle of stellen) {
    for (const stueck of teile(stelle.text)) {
      const text = stueck.trim();
      if (text.length < MINDEST_ZEICHEN && abschnitte.length > 0) continue;
      abschnitte.push({
        ordinal: ordinal++,
        page: stelle.page,
        lineStart: stelle.lineStart,
        lineEnd: stelle.lineEnd,
        text: `${dateiname}\n\n${text}`,
      });
    }
  }

  return abschnitte;
}
