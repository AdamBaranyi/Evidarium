'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import type { Fundstelle } from '@/lib/antwort/fragen';
import { zitatTeile } from '@/lib/antwort/hervorheben';
import { ohneDateinamensvorsatz } from '@/lib/documents/anzeigetext';
import { useTexte } from '@/lib/i18n/client';
import { CHAT } from './texte';
import { useZitatSprache } from './zitat-sprache';

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
  mitDokumentLink = true,
}: {
  inhalt: PanelInhalt | null;
  schliessen: () => void;
  /**
   * In der Demo nicht: Die Dokumentseite liegt im angemeldeten Bereich, und
   * der Link führte Besucher nur zur Anmeldung.
   */
  mitDokumentLink?: boolean;
}) {
  const t = useTexte(CHAT).panel;
  const sprache = useZitatSprache(inhalt?.stelle.documentId);
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
      aria-label={t.label}
      className="quellen-blatt blatt m-auto max-h-[min(84dvh,46rem)] w-[min(46rem,100vw-2rem)] p-0"
    >
      {inhalt && (
        <div className="flex max-h-[min(84dvh,46rem)] flex-col">
          <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-blatt-kante px-5 py-4">
            <h2 className="text-lead leading-tight">{inhalt.stelle.filename}</h2>
            {inhalt.stelle.page !== null && <p className="folio">{t.seite(inhalt.stelle.page)}</p>}
          </header>

          {/* `lang` nur am Dokumenttext, nicht am Hinweis der Oberfläche darüber. */}
          <div className="overflow-y-auto px-5 py-5">
            {teile === null ? (
              <>
                <p className="text-blatt-leise">{t.nichtMarkiert}</p>
                <p lang={sprache} className="mt-4 whitespace-pre-wrap">
                  {abschnitt}
                </p>
              </>
            ) : (
              <p lang={sprache} className="whitespace-pre-wrap text-blatt-leise">
                {teile.vor}
                <mark className="bg-blatt-markierung text-blatt-tinte">{teile.treffer}</mark>
                {teile.nach}
              </p>
            )}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-blatt-kante px-5 py-4">
            {mitDokumentLink ? (
              <Link
                href={`/app/documents/${inhalt.stelle.documentId}`}
                className="font-flaeche text-base underline underline-offset-4"
              >
                {t.ganzesDokument}
              </Link>
            ) : (
              <span />
            )}
            <form method="dialog">
              <button
                type="submit"
                className="min-h-11 font-flaeche text-base underline underline-offset-4"
              >
                {t.schliessen}
              </button>
            </form>
          </footer>
        </div>
      )}
    </dialog>
  );
}
