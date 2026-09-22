'use client';

import { useActionState, useId, useRef } from 'react';
import type { ProjektZeile } from '@/lib/projekte/grenzen';
import { dokumentVerschieben, type ProjektAntwort } from './projekt-aktionen';

/*
 * Das Projekt eines Dokuments, direkt in seiner Zeile.
 *
 * Die Auswahl schickt sich beim Ändern selbst ab — ein Knopf «Verschieben»
 * daneben wäre ein zweiter Schritt für eine Entscheidung, die schon gefallen
 * ist. Die Seite wechselt dabei nicht (WCAG 3.2.2): Nur der Wert ändert sich,
 * und eine Ansage sagt, dass er gespeichert ist.
 */
export function DokumentProjekt({
  documentId,
  dateiname,
  projektId,
  projekte,
}: {
  documentId: string;
  dateiname: string;
  projektId: string | null;
  projekte: ProjektZeile[];
}) {
  const formular = useRef<HTMLFormElement>(null);
  const feld = useId();
  const [antwort, absenden, laeuft] = useActionState<ProjektAntwort, FormData>(
    dokumentVerschieben,
    undefined,
  );

  return (
    <form ref={formular} action={absenden} className="flex min-w-0 flex-col gap-1">
      <input type="hidden" name="documentId" value={documentId} />
      <label htmlFor={feld} className="sr-only">
        Projekt für {dateiname}
      </label>
      <select
        id={feld}
        name="projektId"
        defaultValue={projektId ?? ''}
        disabled={laeuft}
        onChange={() => formular.current?.requestSubmit()}
        className="min-h-11 max-w-full rounded-[10px] bg-flaeche-tief px-3"
      >
        <option value="">Ohne Projekt</option>
        {projekte.map((projekt) => (
          <option key={projekt.id} value={projekt.id}>
            {projekt.name}
          </option>
        ))}
      </select>
      {antwort?.fehler !== undefined ? (
        <p role="alert">{antwort.fehler}</p>
      ) : (
        <p role="status" className="sr-only">
          {antwort?.erledigt}
        </p>
      )}
    </form>
  );
}
