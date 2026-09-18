'use client';

import type { Dokument } from './typen';

/*
 * Welche Dokumente durchsucht werden, entscheidet die fragende Person — und
 * sieht es die ganze Zeit. Eine Antwort, die stillschweigend nur die Hälfte
 * der Ablage gelesen hat, wäre als «keine Grundlage» schlicht falsch.
 *
 * Die Auswahl ist ein Wunsch, keine Berechtigung: Der Server filtert
 * zusätzlich auf den angemeldeten Nutzer.
 */
export function DokumentWahl({
  dokumente,
  gewaehlt,
  setzen,
}: {
  dokumente: Dokument[];
  gewaehlt: string[];
  setzen: (ids: string[]) => void;
}) {
  const alle = gewaehlt.length === dokumente.length;

  function umschalten(id: string, an: boolean) {
    setzen(an ? [...gewaehlt, id] : gewaehlt.filter((wert) => wert !== id));
  }

  return (
    <fieldset className="flex flex-col gap-1 panel p-4">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <legend className="text-tinte-leise">Durchsucht wird in</legend>
        <button
          type="button"
          onClick={() => setzen(alle ? [] : dokumente.map((d) => d.id))}
          className="min-h-11 underline underline-offset-4"
        >
          {alle ? 'Keines auswählen' : 'Alle auswählen'}
        </button>
      </div>

      {dokumente.map((dokument) => (
        <label key={dokument.id} className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            checked={gewaehlt.includes(dokument.id)}
            onChange={(e) => umschalten(dokument.id, e.target.checked)}
            className="size-5 accent-[var(--tinte)]"
          />
          <span>{dokument.filename}</span>
        </label>
      ))}

      {gewaehlt.length === 0 && (
        <p className="mt-2 text-tinte-leise">
          Ohne Auswahl gibt es nichts zu durchsuchen. Wähle mindestens ein Dokument.
        </p>
      )}
    </fieldset>
  );
}
