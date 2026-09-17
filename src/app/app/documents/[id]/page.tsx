import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { readSession, SESSION_COOKIE } from '@/lib/auth/session';
import { abschnitteHolen, dokumentHolen } from '@/lib/documents/abfragen';
import { fehlerText, groesseText, statusText } from '@/lib/documents/zustaende';

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
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <Link href="/app/documents" className="text-beleg underline underline-offset-4">
        Zurück zu den Dokumenten
      </Link>

      <header className="flex flex-col gap-2">
        <h1 className="text-2xl leading-tight">{dokument.filename}</h1>
        <p className="text-ink-soft">
          {dokument.kind.toUpperCase()} · {groesseText(dokument.sizeBytes)} ·{' '}
          {statusText(dokument.status)}
          {dokument.pageCount !== null && ` · ${dokument.pageCount} Seiten`}
          {dokument.charCount !== null && ` · ${dokument.charCount} Zeichen`}
        </p>
        <p className="text-ink-soft">
          Parser {dokument.parserVersion} · Zerlegung {dokument.chunkerVersion}
        </p>
      </header>

      {fehler !== null && (
        <p role="alert" className="border border-edge bg-surface p-4">
          {fehler}
        </p>
      )}

      {dokument.status === 'ready' && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl leading-tight">Gelesener Text</h2>
          {abschnitte.map((abschnitt) => (
            <article key={abschnitt.ordinal} className="border border-edge bg-surface p-4">
              <p className="text-ink-soft">{herkunft(abschnitt)}</p>
              <p className="mt-2 whitespace-pre-wrap">{abschnitt.text}</p>
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
