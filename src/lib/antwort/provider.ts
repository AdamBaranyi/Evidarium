import type { Abschnitt } from './belegpruefung';
import type { Modellantwort } from './schema';

/*
 * Die Schnittstelle zum Sprachmodell.
 *
 * Es gibt zwei Implementierungen, und sie werden **nie** verwechselt: Der
 * Demo-Adapter springt niemals für einen fehlgeschlagenen echten Aufruf ein.
 * Ein Providerfehler ist ein Fehler und wird als solcher gemeldet — sonst
 * sähe eine stille Ersatzantwort aus wie eine echte, und niemand wüsste,
 * welche Antworten im Portfolio je ein Modell gesehen haben.
 */

export type AntwortAnfrage = {
  frage: string;
  abschnitte: Abschnitt[];
  /** Begrenzter Gesprächskontext: die letzten Wechsel, schon gekürzt. */
  verlauf: { rolle: 'nutzer' | 'assistent'; text: string }[];
};

export type AntwortErgebnis = {
  antwort: Modellantwort;
  /** Für das Ausgabenprotokoll. Bei der Demo null — sie kostet nichts. */
  verbrauch: { modell: string; eingabeTokens: number; ausgabeTokens: number } | null;
};

export class ProviderFehler extends Error {
  constructor(
    readonly code: 'zeitlimit' | 'abgelehnt' | 'ungueltige_ausgabe' | 'nicht_erreichbar',
    nachricht: string,
  ) {
    super(nachricht);
    this.name = 'ProviderFehler';
  }
}

export interface AntwortProvider {
  readonly name: string;
  /** `true` nur beim Demo-Adapter. Die Oberfläche zeigt das an. */
  readonly istDemo: boolean;
  antworten(anfrage: AntwortAnfrage): Promise<AntwortErgebnis>;
}
