'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { deleteSession, SESSION_COOKIE } from '@/lib/auth/session';
import { herkunftStimmt } from '@/lib/auth/request';

/**
 * Abmelden heisst: Die Sitzung wird **serverseitig gelöscht**, nicht nur das
 * Cookie entfernt. Ein weggeworfenes Cookie liesse eine gültige Sitzung
 * zurück, die jemand mit einer Kopie weiterverwenden könnte.
 */
export async function abmelden(): Promise<void> {
  if (!(await herkunftStimmt())) return;

  const speicher = await cookies();
  const id = speicher.get(SESSION_COOKIE)?.value;
  if (id) await deleteSession(id);
  speicher.delete(SESSION_COOKIE);

  redirect('/login');
}
