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
 * zwölf Prüffälle nachstellen — einschliesslich der beiden Widersprüche und
 * der beiden untergeschobenen Anweisungen — und das Ergebnis im Protokoll
 * nachlesen.
 */
export default async function DemoPage() {
  if (!env.DEMO_AKTIV) notFound();

  const korpus = await demoKorpus();
  if (!korpus) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl leading-tight">Evidarium ausprobieren</h1>

      <p className="text-lg text-ink-soft">
        Jede Aussage trägt ein wörtliches Zitat. Ein Klick darauf öffnet die Stelle im Dokument.
      </p>

      <section className="flex flex-col gap-2 border border-edge bg-surface p-4">
        <p>
          Die Dokumente stammen von einer erfundenen Firma. Zwei von ihnen widersprechen sich
          absichtlich, und in einem steckt eine untergeschobene Anweisung. Beides darfst du gerne
          ausprobieren.
        </p>
        <p className="text-ink-soft">
          Fragen ja, Hochladen nein: Eigene Dokumente kann nur laden, wer angemeldet ist. Der
          Betrieb dieser Demo kostet Geld, darum gilt ein Kontingent von {env.FRAGEN_JE_SITZUNG}{' '}
          Fragen je Besuch.
        </p>
      </section>

      <Chat dokumente={korpus.dokumente} endpunkt="/api/demo/chat" auswaehlbar={false} />

      <p className="text-ink-soft">
        <Link href="/" className="text-beleg underline underline-offset-4">
          Zurück zur Startseite
        </Link>
      </p>
    </main>
  );
}
