import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readSession, SESSION_COOKIE } from '@/lib/auth/session';

/*
 * Der Einstieg nach der Anmeldung ist die Dokumentbibliothek. Die
 * Sitzungsprüfung steht trotzdem hier: proxy.ts sieht nur, ob ein Cookie da
 * ist, nicht ob es gilt.
 */
export default async function AppPage() {
  const sitzung = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!sitzung) redirect('/login');
  redirect('/app/documents');
}
