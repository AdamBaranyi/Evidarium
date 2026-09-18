'use client';

import { useActionState, useState } from 'react';
import { dokumentEntfernen, type LoeschAntwort } from './actions';

/*
 * Zwei Schritte statt eines Browser-Dialogs.
 *
 * `confirm()` lässt sich nicht gestalten, nicht übersetzen und in manchen
 * Browsern unterdrücken. Ein zweiter Klick im Dokument selbst ist deutlicher
 * — und die Warnung kann sagen, was tatsächlich passiert.
 */
export function LoeschenForm({ documentId, dateiname }: { documentId: string; dateiname: string }) {
  const [sicher, setSicher] = useState(false);
  const [antwort, absenden, laeuft] = useActionState<LoeschAntwort, FormData>(
    dokumentEntfernen,
    undefined,
  );

  if (!sicher) {
    return (
      <button
        type="button"
        onClick={() => setSicher(true)}
        className="min-h-11 self-start border border-kante px-4 py-2"
      >
        Dokument löschen
      </button>
    );
  }

  return (
    <form action={absenden} className="flex flex-col gap-3 panel p-4">
      <input type="hidden" name="documentId" value={documentId} />

      <p>
        <strong>{dateiname}</strong> wird mit allen Abschnitten und Vektoren entfernt. Die Datei
        wird vom Datenträger gelöscht. Das lässt sich nicht rückgängig machen.
      </p>

      {antwort?.fehler !== undefined && (
        <p role="alert" className="text-tinte">
          {antwort.fehler}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={laeuft}
          className="min-h-11 bg-aktion-grund px-5 py-2 text-aktion-tinte disabled:opacity-60"
        >
          {laeuft ? 'Wird gelöscht …' : 'Endgültig löschen'}
        </button>
        <button
          type="button"
          onClick={() => setSicher(false)}
          className="min-h-11 px-4 py-2 underline underline-offset-4"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
