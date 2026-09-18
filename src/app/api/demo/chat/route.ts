import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { herkunftStimmt, clientHerkunft } from '@/lib/auth/request';
import { hashOrigin } from '@/lib/auth/session';
import { ndjsonAntwort } from '@/lib/antwort/strom';
import { fragenVonHerkunftHeute } from '@/lib/budget/budget';
import { demoKorpus } from '@/lib/demo/korpus';
import { besucherKennung, cookieKopf, neueBesucherkennung, DEMO_COOKIE } from '@/lib/demo/besucher';
import { env } from '@/lib/config/env';

/*
 * Die öffentliche Demo.
 *
 * Drei Unterschiede zum angemeldeten Chat, alle drei absichtlich:
 *
 * 1. **Die Dokumentauswahl kommt nicht vom Client.** Sie ist fest der
 *    vorbereitete Korpus. Wer IDs schicken darf, probiert fremde.
 * 2. **Keine Nachfragen mit Verlauf.** Jede Frage steht für sich; ein
 *    mitgeschickter Verlauf wäre freier Text, den jemand bezahlt.
 * 3. **Zwei Zähler**: Fragen je Besuch und Fragen je Herkunft und Tag. Beide
 *    sind umgehbar. Die Schranke, die hält, ist der Tagesdeckel in Dollar.
 */

export const dynamic = 'force-dynamic';

const Eingabe = z.object({ frage: z.string().trim().min(1).max(2000) });

export async function POST(request: Request): Promise<Response> {
  if (!env.DEMO_AKTIV) {
    return NextResponse.json({ fehler: 'Die Demo ist nicht eingeschaltet.' }, { status: 404 });
  }
  if (!(await herkunftStimmt())) {
    return NextResponse.json({ fehler: 'Anfrage abgelehnt.' }, { status: 403 });
  }

  const korpus = await demoKorpus();
  if (!korpus) {
    return NextResponse.json({ fehler: 'Die Demo ist gerade nicht bereit.' }, { status: 503 });
  }

  const roh: unknown = await request.json().catch(() => null);
  const eingabe = Eingabe.safeParse(roh);
  if (!eingabe.success) {
    return NextResponse.json({ fehler: 'Bitte eine Frage stellen.' }, { status: 400 });
  }

  const vorhandenesCookie = (await cookies()).get(DEMO_COOKIE)?.value;
  const besucher = vorhandenesCookie ?? neueBesucherkennung();

  const originHash = hashOrigin(await clientHerkunft());
  if ((await fragenVonHerkunftHeute(originHash)) >= env.DEMO_FRAGEN_JE_HERKUNFT_TAG) {
    /*
     * Eine erreichte Grenze ist **kein Fehler**. Statuscode 200 und dieselbe
     * Form wie eine Antwort: Die Oberfläche zeigt einen freundlichen Satz,
     * keinen roten Kasten.
     */
    return NextResponse.json({
      art: 'budget',
      grund: 'herkunft',
      nachricht: `Von hier kamen heute schon ${env.DEMO_FRAGEN_JE_HERKUNFT_TAG} Fragen. Morgen geht es weiter.`,
    });
  }

  const kopf = vorhandenesCookie
    ? {}
    : { 'Set-Cookie': cookieKopf(besucher, process.env.NODE_ENV === 'production') };

  return ndjsonAntwort(
    {
      userId: korpus.userId,
      documentIds: korpus.dokumente.map((d) => d.id),
      frage: eingabe.data.frage,
      verlauf: [],
      sessionId: besucherKennung(besucher),
      originHash,
    },
    kopf,
  );
}
