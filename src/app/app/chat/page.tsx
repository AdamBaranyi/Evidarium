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
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl leading-tight">Fragen</h1>

      <p className="text-ink-soft">
        Jede Aussage trägt ein wörtliches Zitat. Ein Klick darauf öffnet die Stelle im Dokument.
      </p>

      {env.AI_MODE === 'demo' && (
        <p className="border border-edge bg-surface p-4">
          Demo-Modus: Es wird kein Modell aufgerufen. Die Antworten stammen aus einem festen
          Adapter, durchlaufen aber dieselbe Belegprüfung.
        </p>
      )}

      <Chat dokumente={dokumente} />
    </main>
  );
}
