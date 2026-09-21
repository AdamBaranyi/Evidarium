'use client';

import Link from 'next/link';
import { useEffect } from 'react';

/*
 * Fehlerseite für unerwartete Fehler innerhalb einer Seite.
 *
 * Sie sagt, was passiert ist, ohne Einzelheiten preiszugeben: Die technische
 * Meldung gehört ins Log, nicht auf den Bildschirm. Die `digest`-Kennung
 * zeigt Next nur in Produktion; mit ihr findet man den Eintrag im Log wieder.
 */
export default function Fehler({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[seite] unerwarteter Fehler', error);
  }, [error]);

  return (
    <main
      id="inhalt"
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-16"
    >
      <p className="wortmarke">Evidarium</p>
      <h1 className="text-xl leading-[var(--line-title)]">Hier ist etwas schiefgegangen.</h1>
      <p className="max-w-[var(--mass)] text-tinte-leise">
        Der Fehler ist protokolliert. Meist hilft es, die Seite noch einmal zu laden.
        {error.digest !== undefined && ` Kennung für die Fehlersuche: ${error.digest}.`}
      </p>
      <p className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <button
          type="button"
          onClick={reset}
          className="min-h-11 bg-aktion-grund px-5 py-2 text-aktion-tinte"
        >
          Noch einmal versuchen
        </button>
        <Link href="/" className="underline underline-offset-4">
          Zur Startseite
        </Link>
      </p>
    </main>
  );
}
