import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readSession, sitzungsKennung, SESSION_COOKIE } from '@/lib/auth/session';
import { herkunftStimmt } from '@/lib/auth/request';
import { ndjsonAntwort } from '@/lib/antwort/strom';

/*
 * Der angemeldete Chat. Die Dokumentauswahl kommt vom Client — sie ist ein
 * Wunsch, keine Berechtigung: Die Suchabfragen filtern zusätzlich auf den
 * angemeldeten Nutzer.
 */

export const dynamic = 'force-dynamic';

const Eingabe = z.object({
  frage: z.string().trim().min(1).max(2000),
  documentIds: z.array(z.uuid()).min(1).max(50),
  verlauf: z
    .array(
      z.object({
        rolle: z.enum(['nutzer', 'assistent']),
        text: z.string().max(4000),
      }),
    )
    .max(6)
    .default([]),
});

export async function POST(request: Request): Promise<Response> {
  if (!(await herkunftStimmt())) {
    return NextResponse.json({ fehler: 'Anfrage abgelehnt.' }, { status: 403 });
  }

  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  const sitzung = await readSession(cookie);
  if (!sitzung || !cookie) {
    return NextResponse.json({ fehler: 'Nicht angemeldet.' }, { status: 401 });
  }

  /*
   * Eine Frage mit Verlauf bleibt weit unter 64 KiB. Ohne diese Grenze läse
   * `request.json()` einen beliebig grossen Körper in den Speicher, bevor die
   * Prüfung der Felder überhaupt greift. Befund S6.
   */
  const laenge = Number(request.headers.get('content-length') ?? '0');
  if (!Number.isFinite(laenge) || laenge > 64 * 1024) {
    return NextResponse.json({ fehler: 'Anfrage zu gross.' }, { status: 413 });
  }

  const roh: unknown = await request.json().catch(() => null);
  const eingabe = Eingabe.safeParse(roh);
  if (!eingabe.success) {
    return NextResponse.json(
      { fehler: 'Bitte eine Frage stellen und mindestens ein Dokument auswählen.' },
      { status: 400 },
    );
  }

  return ndjsonAntwort({
    userId: sitzung.userId,
    documentIds: eingabe.data.documentIds,
    frage: eingabe.data.frage,
    verlauf: eingabe.data.verlauf,
    // Der Hash, nie das Cookie selbst.
    sessionId: sitzungsKennung(cookie),
  });
}
