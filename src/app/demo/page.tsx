import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Chat } from '@/app/app/chat/chat';
import { demoKorpus } from '@/lib/demo/korpus';
import { eigeneDokumente } from '@/lib/demo/besucher-dokumente';
import { besucherKennung, DEMO_COOKIE } from '@/lib/demo/besucher';
import { sprache } from '@/lib/i18n/server';
import { EigeneDateien } from './eigene-dateien';
import { DEMO } from './texte';
import { Kopf } from '../_teile/kopf';
import { Licht } from '../_teile/licht';
import { env } from '@/lib/config/env';

export async function generateMetadata(): Promise<Metadata> {
  return { title: DEMO[await sprache()].metaTitel };
}
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

  const t = DEMO[await sprache()];
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
      <Kopf unterzeile={t.unterzeile}>
        <Link href="/login" className="ms-auto underline underline-offset-4">
          {t.anmelden}
        </Link>
      </Kopf>

      <main id="inhalt" className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-5 sm:px-6">
        <h1 className="sr-only">{t.ueberschrift}</h1>
        <Chat
          dokumente={auswahl}
          endpunkt="/api/demo/chat"
          auswaehlbar={false}
          titel={t.titel}
          einleitung={t.einleitung}
          vorschlaege={t.vorschlaege}
          modellAktiv={env.AI_MODE === 'live'}
          deutscheDokumente={korpus.dokumente.map((dokument) => dokument.id)}
          seitenhinweis={
            <>
              <EigeneDateien dokumente={eigene} />
              <p className="border-t border-kante pt-5 text-tinte-leise">
                {t.kontingent(env.FRAGEN_JE_SITZUNG)}
              </p>
            </>
          }
        />
      </main>
    </div>
  );
}
