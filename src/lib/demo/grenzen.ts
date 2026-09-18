/*
 * Grenzen für Dateien, die Besucher in die öffentliche Demo laden.
 *
 * Deutlich enger als für angemeldete Konten, und aus einem anderen Grund:
 * Bei angemeldeten Konten geht es um Betriebsmittel, hier um Missbrauch und
 * um fremde Daten auf fremdem Server.
 *
 * **Die Dateien werden automatisch gelöscht**, und das steht in der
 * Oberfläche, nicht im Kleingedruckten. Wer etwas hochlädt, soll vorher
 * wissen, dass es wieder verschwindet — und dass er nichts Vertrauliches
 * hochladen soll.
 */
export const DEMO_GRENZEN = {
  /** Dateien je Besuch. */
  maxDateien: 3,
  maxBytes: 2 * 1024 * 1024,
  maxSeiten: 10,
  /** Aufbewahrung in Stunden. */
  stunden: 24,
} as const;

export function ablaufZeitpunkt(): Date {
  return new Date(Date.now() + DEMO_GRENZEN.stunden * 60 * 60 * 1000);
}
