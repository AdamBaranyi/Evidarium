'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { readSession, SESSION_COOKIE } from '@/lib/auth/session';
import { herkunftStimmt } from '@/lib/auth/request';
import { dokumentLoeschen } from '@/lib/documents/loeschen';
import { sprache } from '@/lib/i18n/server';
import { DOKUMENTE } from '../texte';

export type LoeschAntwort = { fehler: string } | undefined;

export async function dokumentEntfernen(
  _: LoeschAntwort,
  formular: FormData,
): Promise<LoeschAntwort> {
  const t = DOKUMENTE[await sprache()].meldung;
  if (!(await herkunftStimmt())) return { fehler: t.abgelehnt };

  const sitzung = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!sitzung) redirect('/login');

  const id = z.uuid().safeParse(formular.get('documentId'));
  if (!id.success) return { fehler: t.unbekannt };

  const ergebnis = await dokumentLoeschen(sitzung.userId, id.data);

  // «Gibt es nicht» statt «verboten»: Ein Unterschied in der Meldung würde
  // verraten, dass die ID existiert.
  if (!ergebnis.ok) return { fehler: t.gibtEsNicht };

  revalidatePath('/app/documents');
  redirect('/app/documents');
}
