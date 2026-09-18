import { useSyncExternalStore } from 'react';

const ABFRAGE = '(prefers-reduced-motion: reduce)';

function anmelden(melden: () => void): () => void {
  const abfrage = window.matchMedia(ABFRAGE);
  abfrage.addEventListener('change', melden);
  return () => abfrage.removeEventListener('change', melden);
}

/**
 * `true`, wenn die Person weniger Bewegung wünscht.
 *
 * Der englische Vorsatz `use` ist keine Inkonsequenz, sondern Vorschrift:
 * React erkennt Hooks am Namen, und die Lint-Regel setzt das durch.
 *
 * Über `useSyncExternalStore` statt über einen Effekt mit `setState`: Das
 * Betriebssystem ist hier die Quelle der Wahrheit, nicht der Komponentenstand.
 * Auf dem Server gibt es keine Medienabfrage; dort gilt `false`, und der
 * erste Abgleich im Browser stellt es richtig.
 */
export function useWenigerBewegung(): boolean {
  return useSyncExternalStore(
    anmelden,
    () => window.matchMedia(ABFRAGE).matches,
    () => false,
  );
}
