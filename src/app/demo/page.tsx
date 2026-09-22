import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Chat } from '@/app/app/chat/chat';
import { demoKorpus } from '@/lib/demo/korpus';
import { eigeneDokumente } from '@/lib/demo/besucher-dokumente';
import { besucherKennung, DEMO_COOKIE } from '@/lib/demo/besucher';
import { DEMO_VORSCHLAEGE } from '@/lib/demo/vorschlaege';
import { EigeneDateien } from './eigene-dateien';
import { Kopf } from '../_teile/kopf';
import { Licht } from '../_teile/licht';
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
    <div className="seite-rahmen flex flex-1 flex-col">
      <Licht />
      <Kopf unterzeile="Demo">
        <Link href="/login" className="ms-auto underline underline-offset-4">
          Anmelden
        </Link>
      </Kopf>

      <main id="inhalt" className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-5 sm:px-6">
        <h1 className="sr-only">Demo mit Beispieldokumenten</h1>
        <Chat
          dokumente={auswahl}
          endpunkt="/api/demo/chat"
          auswaehlbar={false}
          titel="Frag diese Dokumente etwas."
          einleitung="Sechs Dokumente der erfundenen Firma Nordstern Digital, dazu deine eigenen, wenn du magst. Jede Aussage trägt ein wörtliches Zitat, ein Klick öffnet die Stelle im Dokument."
          vorschlaege={DEMO_VORSCHLAEGE}
          modellAktiv={env.AI_MODE === 'live'}
          seitenhinweis={
            <>
              <EigeneDateien dokumente={eigene} />
              <p className="border-t border-kante pt-5 text-tinte-leise">
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
