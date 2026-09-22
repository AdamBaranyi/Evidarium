import type { Metadata } from 'next';
import Link from 'next/link';
import { sprache } from '@/lib/i18n/server';
import { Kopf } from './_teile/kopf';
import { GEMEINSAM } from './_teile/texte';

export async function generateMetadata(): Promise<Metadata> {
  return { title: GEMEINSAM[await sprache()].nichtGefunden.metaTitel };
}

/*
 * Die 404-Seite, in der Sprache des Produkts.
 *
 * Vorher stand hier der Standard von Next: englisch, schwarz, fremde Schrift
 * — «404: This page could not be found.». Befund B8 im Prüfbericht.
 *
 * Absichtlich nüchtern: Wer hier landet, soll in einem Satz erfahren, was
 * los ist, und mit einem Klick weiterkommen. Kein Scherz, keine Illustration.
 */
export default async function NichtGefunden() {
  const t = GEMEINSAM[await sprache()].nichtGefunden;
  return (
    <div className="flex flex-1 flex-col">
      <Kopf />
      <main
        id="inhalt"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-16"
      >
        <h1 className="text-xl leading-[var(--line-title)]">{t.titel}</h1>
        <p className="max-w-[var(--mass)] text-tinte-leise">{t.text}</p>
        <p className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/" className="underline underline-offset-4">
            {t.start}
          </Link>
          <Link href="/app/chat" className="underline underline-offset-4">
            {t.anwendung}
          </Link>
        </p>
      </main>
    </div>
  );
}
