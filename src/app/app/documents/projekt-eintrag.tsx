'use client';

import { useActionState, useId, useState } from 'react';
import { PROJEKT_GRENZEN, type ProjektZeile } from '@/lib/projekte/grenzen';
import { projektEntfernen, projektNeuerName, type ProjektAntwort } from './projekt-aktionen';

/*
 * Ein Projekt in der Seitenspalte: Name und Zahl, dahinter aufklappbar
 * Umbenennen und Löschen.
 *
 * Löschen in zwei Schritten wie beim Dokument (E28) — und die Warnung sagt,
 * was wirklich passiert: Das Projekt geht, die Dokumente bleiben.
 */
export function ProjektEintrag({ projekt }: { projekt: ProjektZeile }) {
  const [offen, setOffen] = useState(false);
  const [sicher, setSicher] = useState(false);
  const bereich = useId();
  const feld = useId();
  const [umbenannt, umbenennen, benenntUm] = useActionState<ProjektAntwort, FormData>(
    projektNeuerName,
    undefined,
  );
  const [geloescht, loeschen, loescht] = useActionState<ProjektAntwort, FormData>(
    projektEntfernen,
    undefined,
  );

  return (
    <li className="flex flex-col gap-1">
      <div className="flex min-h-11 items-center gap-3">
        <span className="min-w-0 flex-1">{projekt.name}</span>
        <span className="text-tinte-leise">
          {projekt.anzahl}
          <span className="sr-only"> {projekt.anzahl === 1 ? 'Dokument' : 'Dokumente'}</span>
        </span>
        {/*
         * Der Name gehört in den Namen des Knopfs, sonst hört man fünfmal
         * «Bearbeiten». Als `aria-label`, das mit dem sichtbaren Wort beginnt
         * (WCAG 2.5.3): Eine versteckte Spanne daneben ergab je nach Browser
         * «Bearbeiten : Atlas» mit Leerzeichen.
         */}
        <button
          type="button"
          aria-expanded={offen}
          aria-controls={bereich}
          aria-label={`Bearbeiten: ${projekt.name}`}
          onClick={() => {
            setOffen(!offen);
            setSicher(false);
          }}
          className="min-h-11 underline underline-offset-4"
        >
          Bearbeiten
        </button>
      </div>

      <div id={bereich} hidden={!offen} className="flex flex-col gap-3 pb-3">
        <form action={umbenennen} className="flex flex-col gap-2">
          <input type="hidden" name="projektId" value={projekt.id} />
          <label htmlFor={feld} className="text-tinte-leise">
            Neuer Name
          </label>
          <div className="flex gap-2">
            <input
              id={feld}
              name="name"
              required
              maxLength={PROJEKT_GRENZEN.maxNameZeichen}
              defaultValue={projekt.name}
              autoComplete="off"
              className="min-h-11 min-w-0 flex-1 rounded-[10px] bg-flaeche-tief px-3"
            />
            <button
              type="submit"
              disabled={benenntUm}
              className="min-h-11 shrink-0 rounded-[10px] border border-rand-bedienung px-3 disabled:opacity-55"
            >
              Speichern
            </button>
          </div>
          <Rueckmeldung antwort={umbenannt} />
        </form>

        {sicher ? (
          <form action={loeschen} className="flex flex-col gap-2">
            <input type="hidden" name="projektId" value={projekt.id} />
            <p>
              <strong>{projekt.name}</strong> wird gelöscht. Die Dokumente darin bleiben und stehen
              danach ohne Projekt da.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loescht}
                className="min-h-11 rounded-[10px] bg-aktion-grund px-4 text-aktion-tinte disabled:opacity-55"
              >
                {loescht ? 'Wird gelöscht …' : 'Projekt löschen'}
              </button>
              <button
                type="button"
                onClick={() => setSicher(false)}
                className="min-h-11 underline underline-offset-4"
              >
                Abbrechen
              </button>
            </div>
            <Rueckmeldung antwort={geloescht} />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setSicher(true)}
            className="min-h-11 self-start underline underline-offset-4"
          >
            Projekt löschen …
          </button>
        )}
      </div>
    </li>
  );
}

function Rueckmeldung({ antwort }: { antwort: ProjektAntwort }) {
  if (antwort?.fehler !== undefined) return <p role="alert">{antwort.fehler}</p>;
  return (
    <p role="status" className="text-tinte-leise">
      {antwort?.erledigt}
    </p>
  );
}
