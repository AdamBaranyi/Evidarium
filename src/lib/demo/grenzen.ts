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
  /*
   * Die Grenze je Besuch hängt am Cookie, und ein Cookie ist schnell
   * gelöscht. Darum zwei weitere Stufen, wie bei den Fragen:
   *
   * - **je Herkunft und Tag** hält, wer einfach die Cookies leert;
   * - **gesamt** ist die Schranke, die auch wechselnde Adressen nicht
   *   überwinden: mehr Demo-Dateien als das liegen nie auf dem Server.
   *   300 × 2 MiB sind höchstens 600 MiB, und nach 24 Stunden ist alles weg.
   *
   * Befund B7 im Prüfbericht.
   */
  jeHerkunftTag: 10,
  gesamt: 300,
} as const;

export function ablaufZeitpunkt(): Date {
  return new Date(Date.now() + DEMO_GRENZEN.stunden * 60 * 60 * 1000);
}
