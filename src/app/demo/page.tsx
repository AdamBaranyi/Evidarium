import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Chat } from '@/app/app/chat/chat';
import { demoKorpus } from '@/lib/demo/korpus';
import { env } from '@/lib/config/env';

export const metadata: Metadata = { title: 'Demo – Evidarium' };
export const dynamic = 'force-dynamic';

/*
 * Die öffentliche Demo: fragen ja, hochladen nein.
 *
 * Der Korpus ist derselbe, gegen den die Evaluation läuft. Wer mag, kann die
 * Prüffälle nachstellen — einschliesslich der beiden Widersprüche und der
 * untergeschobenen Anweisung — und das Ergebnis im Protokoll nachlesen.
 */
export default async function DemoPage() {
  if (!env.DEMO_AKTIV) notFound();

  const korpus = await demoKorpus();
  if (!korpus) notFound();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-kante bg-flaeche-tief">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-baseline gap-x-7 gap-y-2 px-6 py-4">
          <Link href="/" className="wortmarke">
            Evidarium
          </Link>
          <p className="text-tinte-leise">Demo</p>
          <Link href="/login" className="ms-auto underline underline-offset-4">
            Anmelden
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <div className="flex flex-col gap-3">
          <h1 className="max-w-[20ch] text-xl leading-[var(--line-title)]">
            Frag diese Dokumente etwas.
          </h1>
          <p className="max-w-[var(--mass)] text-tinte-leise">
            Jede Aussage trägt ein wörtliches Zitat, ein Klick öffnet die Stelle im Dokument. Zwei
            der Dokumente widersprechen sich absichtlich, und in einem steckt eine untergeschobene
            Anweisung — beides darfst du ausprobieren.
          </p>
        </div>

        <Chat
          dokumente={korpus.dokumente}
          endpunkt="/api/demo/chat"
          auswaehlbar={false}
          seitenhinweis={
            <p className="panel p-4 text-tinte-leise">
              Fragen ja, Hochladen nein: Eigene Dokumente kann laden, wer angemeldet ist. Der
              Betrieb kostet Geld, darum gilt ein Kontingent von {env.FRAGEN_JE_SITZUNG} Fragen je
              Besuch.
            </p>
          }
        />
      </main>
    </div>
  );
}
