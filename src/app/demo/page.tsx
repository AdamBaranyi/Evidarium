import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Chat } from '@/app/app/chat/chat';
import { demoKorpus } from '@/lib/demo/korpus';
import { eigeneDokumente } from '@/lib/demo/besucher-dokumente';
import { besucherKennung, DEMO_COOKIE } from '@/lib/demo/besucher';
import { EigeneDateien } from './eigene-dateien';
import { Kopf } from '../_teile/kopf';
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

  // Eigene Dateien des Besuchs; ohne Cookie gibt es noch keine.
  const cookie = (await cookies()).get(DEMO_COOKIE)?.value;
  const eigene = cookie ? await eigeneDokumente(korpus.userId, besucherKennung(cookie)) : [];
  const auswahl = [
    ...korpus.dokumente,
    ...eigene.filter((d) => d.status === 'ready').map((d) => ({ id: d.id, filename: d.filename })),
  ];

  return (
    <div className="flex flex-1 flex-col">
      <Kopf unterzeile="Demo">
        <Link href="/login" className="ms-auto underline underline-offset-4">
          Anmelden
        </Link>
      </Kopf>

      <main id="inhalt" className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <div className="flex flex-col gap-3">
          <h1 className="max-w-[20ch] text-xl leading-[var(--line-title)]">
            Frag diese Dokumente etwas.
          </h1>
          <p className="max-w-[var(--mass)] text-tinte-leise">
            Jede Aussage trägt ein wörtliches Zitat, ein Klick öffnet die Stelle im Dokument. Zwei
            der Dokumente widersprechen sich absichtlich, und in einem steckt eine untergeschobene
            Anweisung — beides darfst du ausprobieren. Du kannst auch eigene Dateien mitbringen.
          </p>
        </div>

        <Chat
          dokumente={auswahl}
          endpunkt="/api/demo/chat"
          auswaehlbar={false}
          seitenhinweis={
            <>
              <EigeneDateien dokumente={eigene} />
              <p className="panel p-4 text-tinte-leise">
                Der Betrieb kostet Geld, darum gilt ein Kontingent von {env.FRAGEN_JE_SITZUNG}{' '}
                Fragen je Besuch.
              </p>
            </>
          }
        />
      </main>
    </div>
  );
}
