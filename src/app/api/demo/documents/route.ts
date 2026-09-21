import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { clientHerkunft, herkunftStimmt } from '@/lib/auth/request';
import { hashOrigin } from '@/lib/auth/session';
import { dokumentAnlegen } from '@/lib/documents/anlegen';
import { einlesenBeauftragen } from '@/lib/jobs/queue';
import { demoKorpus } from '@/lib/demo/korpus';
import { demoUploadsGesamt, uploadsVonHerkunftHeute } from '@/lib/demo/besucher-dokumente';
import { ablaufZeitpunkt, DEMO_GRENZEN } from '@/lib/demo/grenzen';
import { besucherKennung, cookieKopf, neueBesucherkennung, DEMO_COOKIE } from '@/lib/demo/besucher';
import { env } from '@/lib/config/env';

/*
 * Eigene Dateien in der öffentlichen Demo.
 *
 * Eng begrenzt, und die Grenzen haben verschiedene Gründe:
 *
 * - **Drei Dateien, 2 MiB, 10 Seiten** halten die Ablage klein.
 * - **24 Stunden Aufbewahrung** ist der wichtigere Teil. Wer hier etwas
 *   hochlädt, legt fremde Daten auf einen fremden Server; sie sollen nicht
 *   länger liegen bleiben, als die Vorführung dauert. Dass gelöscht wird,
 *   steht gross über dem Formular, nicht im Kleingedruckten.
 *
 * Die Datei gehört dem Demo-Konto, ist aber über den Hash des
 * Besuchercookies diesem Besuch zugeordnet. Ein anderer Besuch sieht sie
 * nie — der Endpunkt für Fragen setzt die Dokumentauswahl selbst.
 */

const MELDUNGEN: Record<string, string> = {
  zu_gross: `Die Datei ist grösser als ${DEMO_GRENZEN.maxBytes / 1024 / 1024} MiB.`,
  typ_nicht_unterstuetzt:
    'Dieses Format wird nicht unterstützt. Erlaubt sind PDF mit Textschicht, TXT und Markdown.',
  zu_viele_dokumente: `In der Demo sind ${DEMO_GRENZEN.maxDateien} eigene Dateien je Besuch möglich.`,
  schon_vorhanden: 'Diese Datei hast du schon hochgeladen.',
};

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

  /*
   * Grösse **vor** dem Einlesen prüfen: `formData()` liest den ganzen Körper
   * in den Speicher, bevor irgendetwas anderes greift. Ohne diese Prüfung
   * nähme der Server eine Datei von einem Gigabyte an, um sie danach
   * abzulehnen. Befund S6. Der Aufschlag deckt die Formularhülle.
   */
  const laenge = Number(request.headers.get('content-length') ?? '0');
  if (!Number.isFinite(laenge) || laenge > DEMO_GRENZEN.maxBytes + 64 * 1024) {
    return NextResponse.json({ fehler: MELDUNGEN.zu_gross }, { status: 413 });
  }

  /*
   * Zwei Grenzen, die das Cookie nicht umgeht — eine erreichte Grenze ist
   * kein Fehler, darum ein Satz statt eines roten Kastens.
   */
  if ((await demoUploadsGesamt()) >= DEMO_GRENZEN.gesamt) {
    return NextResponse.json(
      { fehler: 'Die Demo nimmt gerade keine weiteren Dateien an. In einigen Stunden wieder.' },
      { status: 429 },
    );
  }
  const herkunftHash = hashOrigin(await clientHerkunft());
  if ((await uploadsVonHerkunftHeute(herkunftHash)) >= DEMO_GRENZEN.jeHerkunftTag) {
    return NextResponse.json(
      { fehler: 'Von hier kamen heute schon genug Dateien. Morgen geht es weiter.' },
      { status: 429 },
    );
  }

  const vorhandenesCookie = (await cookies()).get(DEMO_COOKIE)?.value;
  const besucher = vorhandenesCookie ?? neueBesucherkennung();

  const formular = await request.formData();
  const datei = formular.get('datei');

  if (!(datei instanceof File) || datei.size === 0) {
    return NextResponse.json({ fehler: 'Keine Datei erhalten.' }, { status: 400 });
  }

  // Grösse vor dem Lesen prüfen, damit eine überlange Datei nicht erst
  // vollständig im Speicher landet.
  if (datei.size > DEMO_GRENZEN.maxBytes) {
    return NextResponse.json({ fehler: MELDUNGEN.zu_gross }, { status: 413 });
  }

  // Dateinamen vom Mac kommen in NFD zerlegt und erscheinen sonst als
  // «AbkuÌrzungen». Einmal normalisieren, beim Annehmen.
  const dateiname = datei.name.normalize('NFC').slice(0, 255);
  const bytes = new Uint8Array(await datei.arrayBuffer());

  const ergebnis = await dokumentAnlegen(korpus.userId, dateiname, bytes, {
    besucherHash: besucherKennung(besucher),
    herkunftHash,
    ablaufAm: ablaufZeitpunkt(),
    maxBytes: DEMO_GRENZEN.maxBytes,
    maxDateien: DEMO_GRENZEN.maxDateien,
  });

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

  const kopf: Record<string, string> = vorhandenesCookie
    ? {}
    : { 'Set-Cookie': cookieKopf(besucher, process.env.NODE_ENV === 'production') };

  return NextResponse.json(
    { documentId: ergebnis.documentId, stunden: DEMO_GRENZEN.stunden },
    { status: 202, headers: kopf },
  );
}
