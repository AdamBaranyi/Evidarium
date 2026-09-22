'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { herkunftStimmt } from '@/lib/auth/request';
import { readSession, SESSION_COOKIE } from '@/lib/auth/session';
import {
  dokumentZuordnen,
  PROJEKT_GRENZEN,
  projektAnlegen,
  projektLoeschen,
  projektUmbenennen,
  type ProjektFehler,
} from '@/lib/projekte/projekte';

/*
 * Die Aktionen rund um Projekte. Jede prüft Herkunft und Sitzung selbst und
 * reicht die Nutzer-ID an `lib/projekte` weiter, wo die Grenze zwischen
 * Konten liegt. Eine ID aus dem Formular ist ein Wunsch, keine Berechtigung.
 */

/**
 * `name` nur bei einem Fehler: React setzt das Formular nach der Aktion
 * zurück, und der getippte Name soll dann wieder im Feld stehen.
 */
export type ProjektAntwort = { fehler?: string; erledigt?: string; name?: string } | undefined;

const MELDUNG: Record<ProjektFehler, string> = {
  leer: 'Gib dem Projekt einen Namen.',
  zu_lang: `Höchstens ${PROJEKT_GRENZEN.maxNameZeichen} Zeichen.`,
  gibt_es_schon: 'Ein Projekt mit diesem Namen gibt es schon.',
  zu_viele: `Mehr als ${PROJEKT_GRENZEN.maxJeNutzer} Projekte sind nicht vorgesehen.`,
  nicht_gefunden: 'Dieses Projekt oder Dokument gibt es nicht.',
};

async function nutzer(): Promise<string | null> {
  if (!(await herkunftStimmt())) return null;
  const sitzung = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!sitzung) redirect('/login');
  return sitzung.userId;
}

function neuLaden() {
  revalidatePath('/app/documents');
  revalidatePath('/app/chat');
}

export async function projektNeu(_: ProjektAntwort, formular: FormData): Promise<ProjektAntwort> {
  const userId = await nutzer();
  if (!userId) return { fehler: 'Anfrage abgelehnt.' };

  const name = formular.get('name');
  const ergebnis = await projektAnlegen(userId, name);
  if (!ergebnis.ok) {
    return { fehler: MELDUNG[ergebnis.fehler], name: typeof name === 'string' ? name : '' };
  }

  neuLaden();
  return { erledigt: 'Projekt angelegt.' };
}

export async function projektNeuerName(
  _: ProjektAntwort,
  formular: FormData,
): Promise<ProjektAntwort> {
  const userId = await nutzer();
  if (!userId) return { fehler: 'Anfrage abgelehnt.' };

  const id = z.uuid().safeParse(formular.get('projektId'));
  if (!id.success) return { fehler: MELDUNG.nicht_gefunden };

  const ergebnis = await projektUmbenennen(userId, id.data, formular.get('name'));
  if (!ergebnis.ok) return { fehler: MELDUNG[ergebnis.fehler] };

  neuLaden();
  return { erledigt: 'Umbenannt.' };
}

export async function projektEntfernen(
  _: ProjektAntwort,
  formular: FormData,
): Promise<ProjektAntwort> {
  const userId = await nutzer();
  if (!userId) return { fehler: 'Anfrage abgelehnt.' };

  const id = z.uuid().safeParse(formular.get('projektId'));
  if (!id.success) return { fehler: MELDUNG.nicht_gefunden };

  const ergebnis = await projektLoeschen(userId, id.data);
  if (!ergebnis.ok) return { fehler: MELDUNG[ergebnis.fehler] };

  neuLaden();
  return { erledigt: 'Projekt gelöscht, die Dokumente sind noch da.' };
}

/** Leerer Wert heisst: ohne Projekt. */
export async function dokumentVerschieben(
  _: ProjektAntwort,
  formular: FormData,
): Promise<ProjektAntwort> {
  const userId = await nutzer();
  if (!userId) return { fehler: 'Anfrage abgelehnt.' };

  const dokument = z.uuid().safeParse(formular.get('documentId'));
  const rohProjekt = formular.get('projektId');
  const projekt = rohProjekt === '' ? null : z.uuid().safeParse(rohProjekt);
  if (!dokument.success || (projekt !== null && !projekt.success)) {
    return { fehler: MELDUNG.nicht_gefunden };
  }

  const ergebnis = await dokumentZuordnen(userId, dokument.data, projekt?.data ?? null);
  if (!ergebnis.ok) return { fehler: MELDUNG[ergebnis.fehler] };

  neuLaden();
  return { erledigt: 'Zugeordnet.' };
}
