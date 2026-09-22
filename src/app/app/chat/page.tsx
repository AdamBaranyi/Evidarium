import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readSession, SESSION_COOKIE } from '@/lib/auth/session';
import { dokumenteListen } from '@/lib/documents/abfragen';
import { env } from '@/lib/config/env';
import { Chat } from './chat';

export const metadata: Metadata = { title: 'Fragen – Evidarium' };

// Welche Dokumente fertig verarbeitet sind, ändert sich während der Sitzung.
export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const sitzung = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!sitzung) redirect('/login');

  // Nur fertig verarbeitete Dokumente: Ein Dokument in der Warteschlange hat
  // noch keine Abschnitte und wäre in der Auswahl eine leere Zusage.
  const dokumente = (await dokumenteListen(sitzung.userId))
    .filter((dokument) => dokument.status === 'ready')
    .map((dokument) => ({ id: dokument.id, filename: dokument.filename }));

  return (
    <main id="inhalt" className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-5 sm:px-6">
      <h1 className="sr-only">Fragen</h1>
      <Chat
        dokumente={dokumente}
        titel="Frag deine Dokumente etwas."
        einleitung="Jede Aussage trägt ein wörtliches Zitat, ein Klick öffnet die Stelle im Dokument. In der Seitenspalte wählst du, was durchsucht wird."
        modellAktiv={env.AI_MODE === 'live'}
      />
    </main>
  );
}
