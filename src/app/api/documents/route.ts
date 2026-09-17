import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { dokumentAnlegen } from '@/lib/documents/anlegen';
import { GRENZEN } from '@/lib/documents/grenzen';
import { einlesenBeauftragen } from '@/lib/jobs/queue';
import { readSession, SESSION_COOKIE } from '@/lib/auth/session';
import { herkunftStimmt } from '@/lib/auth/request';

/*
 * Upload als Route Handler, nicht als Server Action: Server Actions haben
 * eine eigene, kleine Grenze für den Anfragekörper, und ein Dateiupload
 * gehört ohnehin an einen Endpunkt, der Ströme sauber behandelt.
 *
 * Der Endpunkt nimmt an, legt einen Job an und antwortet. Er wartet nie auf
 * die Verarbeitung.
 */

const MELDUNGEN: Record<string, string> = {
  zu_gross: `Die Datei ist grösser als ${GRENZEN.maxBytes / 1024 / 1024} MiB.`,
  typ_nicht_unterstuetzt:
    'Dieses Format wird nicht unterstützt. Erlaubt sind PDF mit Textschicht, TXT und Markdown.',
  zu_viele_dokumente: `Mehr als ${GRENZEN.maxDokumenteJeNutzer} Dokumente sind zurzeit nicht vorgesehen.`,
  schon_vorhanden: 'Diese Datei ist bereits vorhanden.',
};

export async function POST(request: Request): Promise<NextResponse> {
  if (!(await herkunftStimmt())) {
    return NextResponse.json({ fehler: 'Anfrage abgelehnt.' }, { status: 403 });
  }

  const sitzung = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!sitzung) {
    return NextResponse.json({ fehler: 'Nicht angemeldet.' }, { status: 401 });
  }

  const formular = await request.formData();
  const datei = formular.get('datei');

  if (!(datei instanceof File) || datei.size === 0) {
    return NextResponse.json({ fehler: 'Keine Datei erhalten.' }, { status: 400 });
  }

  // Grösse vor dem Lesen prüfen, damit eine überlange Datei nicht erst
  // vollständig im Speicher landet.
  if (datei.size > GRENZEN.maxBytes) {
    return NextResponse.json({ fehler: MELDUNGEN.zu_gross }, { status: 413 });
  }

  // Dateinamen vom Mac kommen in NFD zerlegt und erscheinen sonst als
  // «AbkuÌrzungen». Einmal normalisieren, beim Annehmen.
  const dateiname = datei.name.normalize('NFC').slice(0, 255);
  const bytes = new Uint8Array(await datei.arrayBuffer());

  const ergebnis = await dokumentAnlegen(sitzung.userId, dateiname, bytes);

  if (!ergebnis.ok) {
    return NextResponse.json(
      { fehler: MELDUNGEN[ergebnis.fehler] ?? 'Upload nicht möglich.' },
      { status: 400 },
    );
  }

  await einlesenBeauftragen({
    documentId: ergebnis.documentId,
    versionId: ergebnis.versionId,
  });

  return NextResponse.json({ documentId: ergebnis.documentId }, { status: 202 });
}
