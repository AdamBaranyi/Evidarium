import type { FrageErgebnis, Phase } from '@/lib/antwort/fragen';

/** Eine Zeile aus dem NDJSON-Strom des Endpunkts. */
export type StromZeile = { art: 'phase'; phase: Phase } | FrageErgebnis;

export type Antwort = Extract<FrageErgebnis, { art: 'antwort' }>;

export type Eintrag =
  | { id: string; art: 'frage'; text: string }
  | { id: string; art: 'antwort'; antwort: Antwort }
  | { id: string; art: 'hinweis'; ton: 'budget' | 'fehler' | 'leer'; nachricht: string };

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
