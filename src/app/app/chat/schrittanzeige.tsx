'use client';

import { PHASENTEXT, type Schritt } from './typen';

/*
 * **Keine erfundene Fortschrittsanzeige.**
 *
 * Jede Zeile steht für einen Schritt, der wirklich gelaufen ist, und die Zeit
 * daneben ist gemessen, nicht geschätzt. Ein Balken, der sich von selbst
 * füllt, wäre einfacher zu bauen und würde behaupten, was niemand weiss.
 *
 * Bewusst ohne Bewegung: Die Zeilen erscheinen im Sekundentakt und wechseln
 * schnell. Eine Einblendung darauf wäre Zappeln, kein Hinweis.
 */
export function Schrittanzeige({ schritte, laeuft }: { schritte: Schritt[]; laeuft: boolean }) {
  if (schritte.length === 0) return null;

  return (
    <ol
      aria-live="polite"
      className="flex max-w-[var(--mass)] flex-col gap-1 border-l border-kante-stark py-1 pl-4"
    >
      {schritte.map((schritt) => {
        const offen = schritt.dauerMs === null && laeuft;
        return (
          <li key={schritt.phase} className="flex flex-wrap justify-between gap-x-6">
            <span className={offen ? '' : 'text-tinte-leise'}>
              {PHASENTEXT[schritt.phase]}
              {offen && ' …'}
            </span>
            {schritt.dauerMs !== null && (
              <span className="text-tinte-leise">{(schritt.dauerMs / 1000).toFixed(1)} s</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
