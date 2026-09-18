'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import type { Fundstelle } from '@/lib/antwort/fragen';
import { zitatTeile } from '@/lib/antwort/hervorheben';
import { ohneDateinamensvorsatz } from '@/lib/documents/anzeigetext';

/*
 * Das Blatt in voller Grösse.
 *
 * Hier wird das Versprechen eingelöst: der **ganze** Abschnitt, mit dem Zitat
 * an seiner Stelle. Absichtlich der ganze Abschnitt — ein aus dem
 * Zusammenhang gerissener Satz kann richtig zitiert und trotzdem irreführend
 * sein. Wer den Umgebungstext sieht, merkt das.
 *
 * Der Umgebungstext steht leiser als das Zitat, nicht versteckt: Er ist
 * Zusammenhang, nicht Beleg.
 */

export type PanelInhalt = { stelle: Fundstelle; zitat: string };

export function QuellenPanel({
  inhalt,
  schliessen,
}: {
  inhalt: PanelInhalt | null;
  schliessen: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    // `showModal` bringt Fokusfalle, Escape und `inert` für den Rest der
    // Seite mit — alles, was ein nachgebautes Panel erst mühsam braucht.
    if (inhalt && !element.open) element.showModal();
    if (!inhalt && element.open) element.close();
  }, [inhalt]);

  const abschnitt = inhalt
    ? ohneDateinamensvorsatz(inhalt.stelle.text, inhalt.stelle.filename)
    : '';
  const teile = inhalt ? zitatTeile(abschnitt, inhalt.zitat) : null;

  return (
    <dialog
      ref={dialog}
      onClose={schliessen}
      aria-label="Fundstelle im Dokument"
      className="quellen-blatt blatt m-auto max-h-[min(84dvh,46rem)] w-[min(46rem,100vw-2rem)] p-0"
    >
      {inhalt && (
        <div className="flex max-h-[min(84dvh,46rem)] flex-col">
          <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-blatt-kante px-5 py-4">
            <h2 className="text-lead leading-tight">{inhalt.stelle.filename}</h2>
            {inhalt.stelle.page !== null && <p className="folio">Seite {inhalt.stelle.page}</p>}
          </header>

          <div className="overflow-y-auto px-5 py-5">
            {teile === null ? (
              <>
                <p className="text-blatt-leise">
                  Das Zitat liess sich im Abschnitt nicht eindeutig markieren. Der Abschnitt steht
                  unverändert darunter.
                </p>
                <p className="mt-4 whitespace-pre-wrap">{abschnitt}</p>
              </>
            ) : (
              <p className="whitespace-pre-wrap text-blatt-leise">
                {teile.vor}
                <mark className="bg-blatt-markierung text-blatt-tinte">{teile.treffer}</mark>
                {teile.nach}
              </p>
            )}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-blatt-kante px-5 py-4">
            <Link
              href={`/app/documents/${inhalt.stelle.documentId}`}
              className="font-flaeche text-base underline underline-offset-4"
            >
              Ganzes Dokument öffnen
            </Link>
            <form method="dialog">
              <button
                type="submit"
                className="min-h-11 font-flaeche text-base underline underline-offset-4"
              >
                Schliessen
              </button>
            </form>
          </footer>
        </div>
      )}
    </dialog>
  );
}
