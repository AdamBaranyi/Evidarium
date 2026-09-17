import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readSession, SESSION_COOKIE } from '@/lib/auth/session';

/*
 * Die Prüfung steht hier, nicht nur in proxy.ts: Der Proxy hält Besucher ohne
 * Cookie ab, aber ob die Sitzung gültig ist, weiss nur die Datenbank. Jede
 * geschützte Seite prüft selbst.
 */
export default async function AppPage() {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  const sitzung = await readSession(id);
  if (!sitzung) redirect('/login');

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-4 px-4 py-12">
      <h1 className="text-2xl leading-tight">Angemeldet</h1>
      <p className="text-ink-soft">{sitzung.email}</p>
    </main>
  );
}
