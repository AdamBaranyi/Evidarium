import type { FrageErgebnis, Phase } from '@/lib/antwort/fragen';

/** Eine Zeile aus dem NDJSON-Strom des Endpunkts. */
export type StromZeile = { art: 'phase'; phase: Phase } | FrageErgebnis;

export type Antwort = Extract<FrageErgebnis, { art: 'antwort' }>;

/*
 * Eine Antwort trägt ihre eigenen Schritte mit: Nach dem Durchlauf klappt
 * die Anzeige zu einer Zeile zusammen, bleibt aber bei der Antwort, zu der
 * sie gehört.
 */
export type Eintrag =
  | { id: string; art: 'frage'; text: string }
  | { id: string; art: 'antwort'; antwort: Antwort; lauf: Lauf }
  | {
      id: string;
      art: 'hinweis';
      ton: 'budget' | 'fehler' | 'leer';
      nachricht: string;
      lauf?: Lauf;
    };

/**
 * Ein abgeschlossener Durchlauf: die Schritte und die ganze Wartezeit, vom
 * Absenden bis zum Ergebnis. Die Summe der Schritte wäre kürzer — vor dem
 * ersten Schritt liegt schon der Weg zum Server.
 */
export type Lauf = { schritte: Schritt[]; wartezeitMs: number };

export type Dokument = { id: string; filename: string };

/**
 * Was gerade wirklich läuft — und wie lange es gedauert hat.
 *
 * `dauerMs === null` heisst: dieser Schritt läuft noch. Die Zeit wird im
 * Browser gemessen, also einschliesslich Netzweg; sie ist damit das, was
 * jemand tatsächlich wartet, und keine geschönte Serverzeit.
 */
export type Schritt = { phase: Phase; seit: number; dauerMs: number | null };

export const PHASENTEXT: Record<Phase, string> = {
  einbetten: 'Frage wird eingebettet',
  suchen: 'Dokumente werden durchsucht',
  antworten: 'Modell formuliert die Antwort',
  pruefen: 'Belege werden geprüft',
};

export const KATEGORIETEXT: Record<Antwort['kategorie'], string> = {
  belegt: 'Belegt',
  teilweise_belegt: 'Teilweise belegt',
  keine_grundlage: 'Keine Grundlage in den Dokumenten',
  widerspruch: 'Widerspruch zwischen Quellen',
};

/** Kurzform für die Legende im leeren Chat. */
export const KATEGORIEKURZ: Record<Antwort['kategorie'], string> = {
  belegt: 'Belegt',
  teilweise_belegt: 'Teilweise belegt',
  keine_grundlage: 'Keine Grundlage',
  widerspruch: 'Widerspruch',
};

/** Was die Kategorie bedeutet — einmal ausgeschrieben, nicht nur als Etikett. */
export const KATEGORIEERKLAERUNG: Record<Antwort['kategorie'], string> = {
  belegt: 'Jede Aussage trägt ein wörtliches Zitat aus deinen Dokumenten.',
  teilweise_belegt: 'Die Dokumente decken die Frage nur zum Teil ab.',
  keine_grundlage: 'Die Dokumente beantworten diese Frage nicht.',
  widerspruch: 'Zwei Stellen sagen Verschiedenes. Beide stehen unten, unaufgelöst.',
};

/** Die Herkunft einer Stelle: bei PDF die Seite, bei Text der Zeilenbereich. */
export function herkunft(stelle: {
  page: number | null;
  lineStart: number | null;
  lineEnd: number | null;
}): string | null {
  if (stelle.page !== null) return `S. ${stelle.page}`;
  if (stelle.lineStart === null) return null;
  if (stelle.lineEnd === stelle.lineStart) return `Zeile ${stelle.lineStart}`;
  return `Zeilen ${stelle.lineStart}–${stelle.lineEnd}`;
}

/**
 * Die Farbe des Urteils.
 *
 * Sie steht **neben** dem Wort, nie an seiner Stelle: Wer Farben nicht
 * unterscheidet, liest dasselbe. Siehe `--urteil-*` in tokens.css.
 */
export const KATEGORIEFARBE: Record<Antwort['kategorie'], string> = {
  belegt: 'bg-urteil-belegt',
  teilweise_belegt: 'bg-urteil-teilweise',
  keine_grundlage: 'bg-urteil-keine',
  widerspruch: 'bg-urteil-widerspruch',
};

/** Die CSS-Farbe eines Urteils, für Punkte und Balken ausserhalb von Tailwind. */
export const KATEGORIEWERT: Record<Antwort['kategorie'], string> = {
  belegt: 'var(--urteil-belegt)',
  teilweise_belegt: 'var(--urteil-teilweise)',
  keine_grundlage: 'var(--urteil-keine)',
  widerspruch: 'var(--urteil-widerspruch)',
};

/** Die Dokumente, auf die sich eine Antwort stützt. */
export function belegteDokumente(antwort: Antwort): Set<string> {
  return new Set(antwort.stellen.map((stelle) => stelle.documentId));
}
