import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readSession, sitzungsKennung, SESSION_COOKIE } from '@/lib/auth/session';
import { herkunftStimmt } from '@/lib/auth/request';
import { frageBeantworten, type Phase } from '@/lib/antwort/fragen';

/*
 * Die Antwort kommt als Strom von NDJSON-Zeilen: erst die Arbeitsschritte,
 * zuletzt genau ein Ergebnis.
 *
 * **Gestreamt werden Arbeitsschritte, nicht Text.** Eine wortweise
 * hereintickernde Antwort wäre hier sogar schädlich: Der Text darf erst
 * erscheinen, wenn die Belegprüfung ihn freigegeben hat — und eine Antwort,
 * die halb dasteht und dann verschwindet, wäre schlimmer als eine, die drei
 * Sekunden später vollständig erscheint.
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

  const roh: unknown = await request.json().catch(() => null);
  const eingabe = Eingabe.safeParse(roh);
  if (!eingabe.success) {
    return NextResponse.json(
      { fehler: 'Bitte eine Frage stellen und mindestens ein Dokument auswählen.' },
      { status: 400 },
    );
  }

  const strom = new ReadableStream<Uint8Array>({
    async start(steuerung) {
      const kodierer = new TextEncoder();
      const zeile = (wert: unknown) =>
        steuerung.enqueue(kodierer.encode(`${JSON.stringify(wert)}\n`));

      try {
        const ergebnis = await frageBeantworten({
          userId: sitzung.userId,
          documentIds: eingabe.data.documentIds,
          frage: eingabe.data.frage,
          verlauf: eingabe.data.verlauf,
          // Der Hash, nie das Cookie selbst.
          sessionId: sitzungsKennung(cookie),
          melden: (phase: Phase) => zeile({ art: 'phase', phase }),
        });
        zeile(ergebnis);
      } catch (fehler) {
        // Bis hierher sind alle bekannten Fälle abgefangen. Was hier ankommt,
        // gehört ins Log — und in die Antwort nur als schlichter Satz.
        console.error('[chat] unerwarteter Fehler', fehler);
        zeile({
          art: 'fehler',
          code: 'unerwartet',
          nachricht: 'Beim Beantworten ist ein unerwarteter Fehler aufgetreten.',
        });
      } finally {
        steuerung.close();
      }
    },
  });

  return new Response(strom, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      // Sonst sammelt ein Reverse Proxy die Zeilen und liefert sie am Ende
      // gemeinsam aus — die Schrittanzeige wäre dann sinnlos.
      'X-Accel-Buffering': 'no',
    },
  });
}
