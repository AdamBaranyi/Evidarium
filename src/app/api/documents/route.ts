import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { dokumentAnlegen } from '@/lib/documents/anlegen';
import { GRENZEN } from '@/lib/documents/grenzen';
import { einlesenBeauftragen } from '@/lib/jobs/queue';
import { readSession, SESSION_COOKIE } from '@/lib/auth/session';
import { herkunftStimmt } from '@/lib/auth/request';
import { MELDUNGEN } from '@/lib/i18n/meldungen';
import { sprache } from '@/lib/i18n/server';

/*
 * Upload als Route Handler, nicht als Server Action: Server Actions haben
 * eine eigene, kleine Grenze für den Anfragekörper, und ein Dateiupload
 * gehört ohnehin an einen Endpunkt, der Ströme sauber behandelt.
 *
 * Der Endpunkt nimmt an, legt einen Job an und antwortet. Er wartet nie auf
 * die Verarbeitung.
 */

function anlegenMeldung(t: (typeof MELDUNGEN)['de'], fehler: string): string {
  const texte: Record<string, string> = {
    zu_gross: t.dateiZuGross(GRENZEN.maxBytes / 1024 / 1024),
    typ_nicht_unterstuetzt: t.typNichtUnterstuetzt,
    zu_viele_dokumente: t.zuVieleDokumente(GRENZEN.maxDokumenteJeNutzer),
    schon_vorhanden: t.schonVorhanden,
  };
  return texte[fehler] ?? t.uploadNichtMoeglich;
}

export async function POST(request: Request): Promise<NextResponse> {
  const t = MELDUNGEN[await sprache()];
  if (!(await herkunftStimmt())) {
    return NextResponse.json({ fehler: t.abgelehnt }, { status: 403 });
  }

  const sitzung = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!sitzung) {
    return NextResponse.json({ fehler: t.nichtAngemeldet }, { status: 401 });
  }

  // Grösse vor dem Einlesen prüfen: `formData()` läse sonst alles in den
  // Speicher, bevor irgendeine Grenze greift. Befund S6.
  const laenge = Number(request.headers.get('content-length') ?? '0');
  if (!Number.isFinite(laenge) || laenge > GRENZEN.maxBytes + 64 * 1024) {
    return NextResponse.json({ fehler: anlegenMeldung(t, 'zu_gross') }, { status: 413 });
  }

  const formular = await request.formData();
  const datei = formular.get('datei');

  if (!(datei instanceof File) || datei.size === 0) {
    return NextResponse.json({ fehler: t.keineDatei }, { status: 400 });
  }

  // Grösse vor dem Lesen prüfen, damit eine überlange Datei nicht erst
  // vollständig im Speicher landet.
  if (datei.size > GRENZEN.maxBytes) {
    return NextResponse.json({ fehler: anlegenMeldung(t, 'zu_gross') }, { status: 413 });
  }

  // Dateinamen vom Mac kommen in NFD zerlegt und erscheinen sonst als
  // «AbkuÌrzungen». Einmal normalisieren, beim Annehmen.
  const dateiname = datei.name.normalize('NFC').slice(0, 255);
  const bytes = new Uint8Array(await datei.arrayBuffer());

  const ergebnis = await dokumentAnlegen(sitzung.userId, dateiname, bytes);

  if (!ergebnis.ok) {
    return NextResponse.json({ fehler: anlegenMeldung(t, ergebnis.fehler) }, { status: 400 });
  }

  await einlesenBeauftragen({
    documentId: ergebnis.documentId,
    versionId: ergebnis.versionId,
  });

  return NextResponse.json({ documentId: ergebnis.documentId }, { status: 202 });
}
