import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { readSession, SESSION_COOKIE } from '@/lib/auth/session';
import { abschnitteHolen, dokumentHolen } from '@/lib/documents/abfragen';
import { artText, fehlerText, groesseText, statusText } from '@/lib/documents/zustaende';
import { ohneDateinamensvorsatz } from '@/lib/documents/anzeigetext';
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

  const abschnitte = dokument.status === 'ready' ? await abschnitteHolen(sitzung.userId, id) : [];
  const fehler = fehlerText(dokument.errorCode);

  return (
    <main id="inhalt" className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <Link href="/app/documents" className="underline underline-offset-4">
        Zurück zu den Dokumenten
      </Link>

      <header className="flex flex-col gap-2">
        <h1 className="text-xl leading-[var(--line-title)]">{dokument.filename}</h1>
        <p className="text-tinte-leise">
          {artText(dokument.kind)}, {groesseText(dokument.sizeBytes)}. {statusText(dokument.status)}
          {dokument.pageCount !== null && `, ${dokument.pageCount} Seiten`}
          {dokument.charCount !== null && `, ${dokument.charCount} Zeichen`}.
        </p>
        <p className="text-tinte-leise">
          Gelesen mit Parser {dokument.parserVersion}, zerlegt mit {dokument.chunkerVersion}.
        </p>
      </header>

      {fehler !== null && (
        <p role="alert" className="panel p-4">
          {fehler}
        </p>
      )}

      <LoeschenForm documentId={dokument.id} dateiname={dokument.filename} />

      {dokument.status === 'ready' && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg leading-tight">Gelesener Text</h2>
          {abschnitte.map((abschnitt) => (
            /* Dokumentinhalt gehört auf ein Blatt, auch hier. */
            <article key={abschnitt.ordinal} className="blatt max-w-[var(--mass-blatt)] px-5 py-4">
              <p className="folio border-b border-blatt-kante pb-2">{herkunft(abschnitt)}</p>
              <p className="mt-3 whitespace-pre-wrap">
                {ohneDateinamensvorsatz(abschnitt.text, dokument.filename)}
              </p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

/**
 * Die Herkunft einer Textstelle — bei PDF die Seite, bei Text der
 * Zeilenbereich. **Niemals eine erfundene Seitenzahl**: Was nicht aus dem
 * Dokument stammt, steht auch nicht da.
 */
function herkunft(abschnitt: {
  page: number | null;
  lineStart: number | null;
  lineEnd: number | null;
}): string {
  if (abschnitt.page !== null) return `Seite ${abschnitt.page}`;
  if (abschnitt.lineStart === null) return 'Abschnitt';
  if (abschnitt.lineEnd === abschnitt.lineStart) return `Zeile ${abschnitt.lineStart}`;
  return `Zeilen ${abschnitt.lineStart}–${abschnitt.lineEnd}`;
}
