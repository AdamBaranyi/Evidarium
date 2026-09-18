'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { readSession, SESSION_COOKIE } from '@/lib/auth/session';
import { herkunftStimmt } from '@/lib/auth/request';
import { dokumentLoeschen } from '@/lib/documents/loeschen';

export type LoeschAntwort = { fehler: string } | undefined;

export async function dokumentEntfernen(
  _: LoeschAntwort,
  formular: FormData,
): Promise<LoeschAntwort> {
  if (!(await herkunftStimmt())) return { fehler: 'Anfrage abgelehnt.' };

  const sitzung = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!sitzung) redirect('/login');

  const id = z.uuid().safeParse(formular.get('documentId'));
  if (!id.success) return { fehler: 'Unbekanntes Dokument.' };

  const ergebnis = await dokumentLoeschen(sitzung.userId, id.data);

  // «Gibt es nicht» statt «verboten»: Ein Unterschied in der Meldung würde
  // verraten, dass die ID existiert.
  if (!ergebnis.ok) return { fehler: 'Dieses Dokument gibt es nicht.' };

  revalidatePath('/app/documents');
  redirect('/app/documents');
}
