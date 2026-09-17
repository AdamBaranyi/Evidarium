'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import type { Fundstelle } from '@/lib/antwort/fragen';
import { zitatTeile } from '@/lib/antwort/hervorheben';
import { herkunft } from './typen';

/*
 * Das Quellen-Panel ist die Einlösung des Versprechens: ein Klick auf den
 * Beleg, und der **ganze** Abschnitt steht da, mit dem Zitat an seiner Stelle.
 *
 * Absichtlich der ganze Abschnitt, nicht nur das Zitat: Ein aus dem
 * Zusammenhang gerissener Satz kann richtig zitiert und trotzdem irreführend
 * sein. Wer den Umgebungstext sieht, merkt das.
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

  const teile = inhalt ? zitatTeile(inhalt.stelle.text, inhalt.zitat) : null;

  return (
    <dialog
      ref={dialog}
      onClose={schliessen}
      aria-label="Fundstelle im Dokument"
      className="m-auto max-h-[min(80dvh,40rem)] w-[min(44rem,100vw-2rem)] border border-edge bg-surface p-0 text-ink backdrop:bg-[rgb(0_0_0/0.45)]"
    >
      {inhalt && (
        <div className="flex max-h-[min(80dvh,40rem)] flex-col">
          <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-edge p-4">
            <div>
              <h2 className="text-lg leading-tight">{inhalt.stelle.filename}</h2>
              <p className="text-ink-soft">{herkunft(inhalt.stelle) ?? 'Abschnitt'}</p>
            </div>
            <form method="dialog">
              <button type="submit" className="min-h-11 px-3 underline underline-offset-4">
                Schliessen
              </button>
            </form>
          </header>

          <div className="overflow-y-auto p-4">
            {teile === null ? (
              <>
                <p className="text-ink-soft">
                  Das Zitat liess sich im Abschnitt nicht eindeutig markieren. Der Abschnitt steht
                  unverändert darunter.
                </p>
                <p className="mt-3 whitespace-pre-wrap">{inhalt.stelle.text}</p>
              </>
            ) : (
              <p className="whitespace-pre-wrap">
                {teile.vor}
                <mark className="bg-[var(--beleg-weich)] text-ink">{teile.treffer}</mark>
                {teile.nach}
              </p>
            )}
          </div>

          <footer className="border-t border-edge p-4">
            <Link
              href={`/app/documents/${inhalt.stelle.documentId}`}
              className="text-beleg underline underline-offset-4"
            >
              Ganzes Dokument öffnen
            </Link>
          </footer>
        </div>
      )}
    </dialog>
  );
}
