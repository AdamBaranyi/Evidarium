'use client';

import { useActionState } from 'react';
import { PROJEKT_GRENZEN } from '@/lib/projekte/grenzen';
import { projektNeu, type ProjektAntwort } from './projekt-aktionen';

/*
 * Ein neues Projekt: ein Feld, ein Knopf.
 *
 * React setzt das Formular nach der Aktion zurück, auch wenn der Server
 * «gibt es schon» meldet. Damit der getippte Name dann nicht verloren ist,
 * kommt er als `name` in der Antwort zurück und steht wieder im Feld.
 */
export function ProjektNeu() {
  const [antwort, absenden, laeuft] = useActionState<ProjektAntwort, FormData>(
    projektNeu,
    undefined,
  );

  return (
    <form action={absenden} className="flex flex-col gap-2 border-t border-kante pt-4">
      <label htmlFor="projekt-name">Neues Projekt</label>
      <div className="flex gap-2">
        <input
          id="projekt-name"
          name="name"
          required
          maxLength={PROJEKT_GRENZEN.maxNameZeichen}
          autoComplete="off"
          defaultValue={antwort?.name ?? ''}
          className="min-h-11 min-w-0 flex-1 rounded-[10px] bg-flaeche-tief px-3"
        />
        <button
          type="submit"
          disabled={laeuft}
          className="min-h-11 shrink-0 rounded-[10px] bg-aktion-grund px-4 text-aktion-tinte disabled:opacity-55"
        >
          Anlegen
        </button>
      </div>
      {antwort?.fehler !== undefined ? (
        <p role="alert">{antwort.fehler}</p>
      ) : (
        <p role="status" className="text-tinte-leise">
          {antwort?.erledigt}
        </p>
      )}
    </form>
  );
}
