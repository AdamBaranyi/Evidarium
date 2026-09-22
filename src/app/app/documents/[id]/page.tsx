import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { readSession, SESSION_COOKIE } from '@/lib/auth/session';
import { abschnitteHolen, dokumentHolen } from '@/lib/documents/abfragen';
import { artText, fehlerText, groesseText, statusText } from '@/lib/documents/zustaende';
import { ohneDateinamensvorsatz } from '@/lib/documents/anzeigetext';
import { sprache } from '@/lib/i18n/server';
import { sprachTag } from '@/lib/i18n/sprachen';
import { DOKUMENTE } from '../texte';
import { LoeschenForm } from './loeschen-form';

export const dynamic = 'force-dynamic';

export default async function DokumentDetail({ params }: { params: Promise<{ id: string }> }) {
  const sitzung = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!sitzung) redirect('/login');

  const { id } = await params;
  const dokument = await dokumentHolen(sitzung.userId, id);

  // Fremdes oder gelöschtes Dokument: 404, nicht 403. Ein «verboten» würde
  // verraten, dass es die ID gibt.
  if (!dokument) notFound();

  const s = await sprache();
  const t = DOKUMENTE[s];
  const abschnitte = dokument.status === 'ready' ? await abschnitteHolen(sitzung.userId, id) : [];
  const fehler = fehlerText(dokument.errorCode, s);

  /*
   * Dieselbe Fensterform wie die Liste: Leiste mit Name und Rückweg, darunter
   * rollt der Inhalt — am Schreibtisch innerhalb des Fensters, nie die Seite.
   */
  return (
    <main id="inhalt" className="mx-auto flex w-full max-w-6xl flex-col px-4 py-5 sm:px-6">
      <section aria-labelledby="dokument-titel" className="fenster-voll panel overflow-hidden">
        <div className="panel-leiste min-h-[3.25rem] items-center py-1">
          <Link
            href="/app/documents"
            className="min-h-11 content-center underline underline-offset-4"
          >
            {t.detail.zurueck}
          </Link>
          <h1 id="dokument-titel" className="me-auto min-w-0 text-tinte">
            {dokument.filename}
          </h1>
        </div>

        <div className="fenster-rollt flex flex-col gap-6 p-5">
          <header className="flex flex-col gap-1">
            <p className="text-tinte-leise">
              {artText(dokument.kind, s)}, {groesseText(dokument.sizeBytes, s)}.{' '}
              {statusText(dokument.status, s)}
              {dokument.pageCount !== null && `, ${t.seiten(dokument.pageCount)}`}
              {dokument.charCount !== null &&
                `, ${t.zeichen(dokument.charCount.toLocaleString(sprachTag(s)))}`}
              .
            </p>
            <p className="text-tinte-leise">
              {t.detail.parser(dokument.parserVersion ?? '–', dokument.chunkerVersion ?? '–')}
            </p>
          </header>

          {fehler !== null && (
            <p role="alert" className="rounded-[10px] border border-kante bg-flaeche-tief p-4">
              {fehler}
            </p>
          )}

          <LoeschenForm documentId={dokument.id} dateiname={dokument.filename} />

          {dokument.status === 'ready' && (
            <section className="flex flex-col gap-4">
              <h2 className="text-lg leading-tight">{t.detail.gelesen}</h2>
              {abschnitte.map((abschnitt) => (
                /* Dokumentinhalt gehört auf ein Blatt, auch hier. */
                <article
                  key={abschnitt.ordinal}
                  className="blatt max-w-[var(--mass-blatt)] px-5 py-4"
                >
                  <p className="folio border-b border-blatt-kante pb-2">
                    {herkunft(abschnitt, t.detail)}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap">
                    {ohneDateinamensvorsatz(abschnitt.text, dokument.filename)}
                  </p>
                </article>
              ))}
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

/**
 * Die Herkunft einer Textstelle — bei PDF die Seite, bei Text der
 * Zeilenbereich. **Niemals eine erfundene Seitenzahl**: Was nicht aus dem
 * Dokument stammt, steht auch nicht da.
 */
function herkunft(
  abschnitt: { page: number | null; lineStart: number | null; lineEnd: number | null },
  t: (typeof DOKUMENTE)['de']['detail'],
): string {
  if (abschnitt.page !== null) return t.seite(abschnitt.page);
  if (abschnitt.lineStart === null) return t.abschnitt;
  if (abschnitt.lineEnd === null || abschnitt.lineEnd === abschnitt.lineStart) {
    return t.zeile(abschnitt.lineStart);
  }
  return t.zeilen(abschnitt.lineStart, abschnitt.lineEnd);
}
