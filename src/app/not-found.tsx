import type { Metadata } from 'next';
import Link from 'next/link';
import { Kopf } from './_teile/kopf';

export const metadata: Metadata = { title: 'Nicht gefunden – Evidarium' };

/*
 * Die 404-Seite, in der Sprache des Produkts.
 *
 * Vorher stand hier der Standard von Next: englisch, schwarz, fremde Schrift
 * — «404: This page could not be found.». Befund B8 im Prüfbericht.
 *
 * Absichtlich nüchtern: Wer hier landet, soll in einem Satz erfahren, was
 * los ist, und mit einem Klick weiterkommen. Kein Scherz, keine Illustration.
 */
export default function NichtGefunden() {
  return (
    <div className="flex flex-1 flex-col">
      <Kopf />
      <main
        id="inhalt"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-16"
      >
        <h1 className="text-xl leading-[var(--line-title)]">Diese Seite gibt es nicht.</h1>
        <p className="max-w-[var(--mass)] text-tinte-leise">
          Vielleicht ist die Adresse vertippt, oder die Seite wurde entfernt. Gelöschte Dokumente
          sind endgültig weg — auch ihr Link führt hierher.
        </p>
        <p className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/" className="underline underline-offset-4">
            Zur Startseite
          </Link>
          <Link href="/app/chat" className="underline underline-offset-4">
            Zur Anwendung
          </Link>
        </p>
      </main>
    </div>
  );
}
