'use client';

import { useTexte } from '@/lib/i18n/client';
import { CHAT } from './texte';
import type { Dokument } from './typen';

/*
 * Die Seitenspalte des Fensters: welche Dokumente durchsucht werden — und,
 * nach einer Antwort, **welche davon sie getragen haben**.
 *
 * Der farbige Punkt ist kein Schmuck. Er beantwortet auf einen Blick die
 * Frage, die man sonst durch alle Belege hindurch nachzählen müsste: Worauf
 * steht diese Antwort? Er trägt die Farbe des Urteils, und daneben steht das
 * Urteil in der Antwort als Wort.
 *
 * Die Auswahl ist ein Wunsch, keine Berechtigung: Der Server filtert
 * zusätzlich auf den angemeldeten Nutzer.
 */
export function DokumentWahl({
  dokumente,
  gewaehlt,
  setzen,
  auswaehlbar = true,
  belegt,
  farbe,
}: {
  dokumente: Dokument[];
  gewaehlt: string[];
  setzen: (ids: string[]) => void;
  auswaehlbar?: boolean;
  /** IDs der Dokumente, auf die sich die letzte Antwort stützt. */
  belegt: Set<string> | undefined;
  /** Farbe des letzten Urteils. */
  farbe: string | undefined;
}) {
  const t = useTexte(CHAT).wahl;
  const alle = gewaehlt.length === dokumente.length;

  function umschalten(id: string, an: boolean) {
    setzen(an ? [...gewaehlt, id] : gewaehlt.filter((wert) => wert !== id));
  }

  return (
    <div data-rundgang="dokumente" className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2>{t.titel}</h2>
        {auswaehlbar && (
          <button
            type="button"
            onClick={() => setzen(alle ? [] : dokumente.map((d) => d.id))}
            className="min-h-11 underline underline-offset-4"
          >
            {alle ? t.keines : t.alle}
          </button>
        )}
      </div>

      <ul className="flex flex-col gap-1">
        {dokumente.map((dokument) => {
          const zaehlt = belegt?.has(dokument.id) ?? false;
          return (
            <li key={dokument.id}>
              {auswaehlbar ? (
                <label className="flex min-h-11 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={gewaehlt.includes(dokument.id)}
                    onChange={(e) => umschalten(dokument.id, e.target.checked)}
                    className="size-5 accent-[var(--tinte)]"
                  />
                  <Punkt an={zaehlt} farbe={farbe} />
                  <span className={zaehlt ? '' : 'text-tinte-leise'}>{dokument.filename}</span>
                </label>
              ) : (
                <p className="flex min-h-9 items-center gap-3">
                  <Punkt an={zaehlt} farbe={farbe} />
                  <span className={zaehlt ? '' : 'text-tinte-leise'}>{dokument.filename}</span>
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {auswaehlbar && gewaehlt.length === 0 && <p className="text-tinte-leise">{t.ohneAuswahl}</p>}
    </div>
  );
}

function Punkt({ an, farbe }: { an: boolean; farbe: string | undefined }) {
  return (
    <span
      aria-hidden
      className="size-[7px] shrink-0 rounded-full bg-kante-stark transition-colors duration-[var(--dauer-mittel)]"
      style={an && farbe ? { background: farbe } : undefined}
    />
  );
}
