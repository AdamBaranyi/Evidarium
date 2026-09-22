import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readSession, SESSION_COOKIE } from '@/lib/auth/session';
import { dokumenteListen } from '@/lib/documents/abfragen';
import { env } from '@/lib/config/env';
import { projekteListen } from '@/lib/projekte/projekte';
import { Chat } from './chat';
import { ProjektWahl } from './projekt-wahl';

export const metadata: Metadata = { title: 'Fragen – Evidarium' };

// Welche Dokumente fertig verarbeitet sind, ändert sich während der Sitzung.
export const dynamic = 'force-dynamic';

/*
 * Das Projekt steht in der Adresse (`?projekt=…`), nicht im Zustand: Es
 * übersteht das Neuladen, lässt sich als Lesezeichen ablegen, und ein
 * Wechsel beginnt eine neue Unterhaltung — der Chat hängt am Projekt
 * (`key`). Eine unbekannte oder fremde ID fällt still auf «Alle Dokumente»
 * zurück; eine Fehlermeldung verriete, ob es sie gibt.
 */
export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ projekt?: string | string[] }>;
}) {
  const sitzung = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!sitzung) redirect('/login');

  const [alle, projekte, { projekt: gewuenscht }] = await Promise.all([
    dokumenteListen(sitzung.userId),
    projekteListen(sitzung.userId),
    searchParams,
  ]);

  // Nur fertig verarbeitete Dokumente: Ein Dokument in der Warteschlange hat
  // noch keine Abschnitte und wäre in der Auswahl eine leere Zusage.
  const bereit = alle.filter((dokument) => dokument.status === 'ready');
  const aktiv = projekte.find((projekt) => projekt.id === gewuenscht) ?? null;
  const dokumente = bereit
    .filter((dokument) => aktiv === null || dokument.projectId === aktiv.id)
    .map((dokument) => ({ id: dokument.id, filename: dokument.filename }));

  const mitZahl = projekte.map((projekt) => ({
    ...projekt,
    anzahl: bereit.filter((dokument) => dokument.projectId === projekt.id).length,
  }));

  return (
    <main id="inhalt" className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-5 sm:px-6">
      <h1 className="sr-only">Fragen{aktiv ? ` in ${aktiv.name}` : ''}</h1>
      <Chat
        key={aktiv?.id ?? 'alle'}
        dokumente={dokumente}
        bereich={aktiv?.name}
        seitenkopf={
          projekte.length > 0 ? (
            <ProjektWahl projekte={mitZahl} aktiv={aktiv?.id ?? null} gesamt={bereit.length} />
          ) : undefined
        }
        titel={aktiv ? `Frag ${aktiv.name} etwas.` : 'Frag deine Dokumente etwas.'}
        einleitung={
          aktiv
            ? 'Gesucht wird nur in den Dokumenten dieses Projekts. Jede Aussage trägt ein wörtliches Zitat, ein Klick öffnet die Stelle im Dokument.'
            : 'Jede Aussage trägt ein wörtliches Zitat, ein Klick öffnet die Stelle im Dokument. In der Seitenspalte wählst du, was durchsucht wird.'
        }
        modellAktiv={env.AI_MODE === 'live'}
      />
    </main>
  );
}
