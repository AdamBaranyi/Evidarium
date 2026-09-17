/*
 * Preistabelle, datiert und konfigurierbar.
 *
 * **Preise werden nicht ausgedacht im Code hinterlegt.** Was hier steht,
 * stammt aus der offiziellen Preisliste vom genannten Tag. Ändert der
 * Anbieter etwas, ändert sich diese Datei — nicht eine Zahl irgendwo in
 * einer Berechnung.
 *
 * Ist ein Modell hier nicht aufgeführt, bleibt der Live-Modus gesperrt.
 * Lieber keine Antwort als eine Antwort, deren Kosten niemand kennt.
 */

export type Preis = {
  /** US-Dollar je Million Eingabe-Token. */
  eingabe: number;
  /** US-Dollar je Million Ausgabe-Token. */
  ausgabe: number;
};

export const PREISSTAND = '2026-09-17';
export const WAEHRUNG = 'USD';

const PREISE: Record<string, Preis> = {
  'claude-haiku-4-5': { eingabe: 1.0, ausgabe: 5.0 },
  'claude-sonnet-5': { eingabe: 2.0, ausgabe: 10.0 },
  'claude-opus-5': { eingabe: 5.0, ausgabe: 25.0 },
};

/**
 * Der Anbieter meldet das tatsächlich verwendete Modell oft mit Datumszusatz
 * zurück (`claude-haiku-4-5-20251001`). Für die Preissuche zählt die Familie.
 */
function familie(modell: string): string {
  const treffer = Object.keys(PREISE).find((name) => modell.startsWith(name));
  return treffer ?? modell;
}

export function preisFuer(modell: string): Preis | null {
  return PREISE[familie(modell)] ?? null;
}

export function modellHatPreis(modell: string): boolean {
  return preisFuer(modell) !== null;
}

/**
 * Geschätzte Kosten in US-Dollar.
 *
 * **Immer eine Schätzung**, nie eine Abrechnung: Der Anbieter rechnet nach
 * eigenen Regeln ab, und zwischengespeicherte Eingaben kosten anders. Die
 * Oberfläche nennt das ausdrücklich so.
 */
export function kostenSchaetzen(
  modell: string,
  eingabeTokens: number,
  ausgabeTokens: number,
): number | null {
  const preis = preisFuer(modell);
  if (!preis) return null;
  return (eingabeTokens / 1_000_000) * preis.eingabe + (ausgabeTokens / 1_000_000) * preis.ausgabe;
}

/**
 * Was ein Aufruf höchstens kosten kann — für die Reservierung **vor** dem
 * Aufruf, wenn der tatsächliche Verbrauch noch niemand kennt.
 */
export function maximalkosten(
  modell: string,
  maxEingabeTokens: number,
  maxAusgabeTokens: number,
): number | null {
  return kostenSchaetzen(modell, maxEingabeTokens, maxAusgabeTokens);
}
