'use client';

import { PHASENTEXT, type Schritt } from './typen';

/*
 * **Keine erfundene Fortschrittsanzeige.**
 *
 * Jede Zeile steht für einen Schritt, der wirklich gelaufen ist, und die
 * Zeit daneben ist gemessen, nicht geschätzt. Ein Balken, der sich von selbst
 * füllt, wäre einfacher zu bauen und würde behaupten, was niemand weiss.
 */
export function Schrittanzeige({ schritte, laeuft }: { schritte: Schritt[]; laeuft: boolean }) {
  if (schritte.length === 0) return null;

  return (
    <ol aria-live="polite" className="flex flex-col gap-1 border border-edge bg-surface p-4">
      {schritte.map((schritt) => (
        <li key={schritt.phase} className="flex flex-wrap justify-between gap-3">
          <span className={schritt.dauerMs === null && laeuft ? '' : 'text-ink-soft'}>
            {PHASENTEXT[schritt.phase]}
            {schritt.dauerMs === null && laeuft && ' …'}
          </span>
          {schritt.dauerMs !== null && (
            <span className="text-ink-soft">{(schritt.dauerMs / 1000).toFixed(1)} s</span>
          )}
        </li>
      ))}
    </ol>
  );
}
