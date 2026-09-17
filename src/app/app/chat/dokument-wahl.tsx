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
    <fieldset className="flex flex-col gap-2 border border-edge bg-surface p-4">
      <legend className="px-1">Durchsuchte Dokumente</legend>

      <button
        type="button"
        onClick={() => setzen(alle ? [] : dokumente.map((d) => d.id))}
        className="min-h-11 self-start underline underline-offset-4"
      >
        {alle ? 'Keines auswählen' : 'Alle auswählen'}
      </button>

      {dokumente.map((dokument) => (
        <label key={dokument.id} className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            checked={gewaehlt.includes(dokument.id)}
            onChange={(e) => umschalten(dokument.id, e.target.checked)}
            className="size-5"
          />
          <span>{dokument.filename}</span>
        </label>
      ))}

      {gewaehlt.length === 0 && (
        <p className="text-ink-soft">
          Mindestens ein Dokument auswählen, sonst gibt es nichts zu durchsuchen.
        </p>
      )}
    </fieldset>
  );
}
