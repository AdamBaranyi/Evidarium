import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readSession, SESSION_COOKIE } from '@/lib/auth/session';
import { dokumenteListen } from '@/lib/documents/abfragen';
import { artText, fehlerText, groesseText, statusText } from '@/lib/documents/zustaende';
import { UploadForm } from './upload-form';

export const metadata: Metadata = { title: 'Dokumente – Evidarium' };

// Die Liste zeigt Verarbeitungsstände; ein zwischengespeicherter Stand wäre
// sofort falsch.
export const dynamic = 'force-dynamic';

export default async function DokumentePage() {
  const sitzung = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!sitzung) redirect('/login');

  const dokumente = await dokumenteListen(sitzung.userId);

  return (
    <main id="inhalt" className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <h1 className="text-xl leading-[var(--line-title)]">Dokumente</h1>

      <UploadForm />

      {dokumente.length === 0 ? (
        <p className="text-tinte-leise">
          Noch keine Dokumente. Lade ein PDF, eine Textdatei oder Markdown hoch.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {dokumente.map((dokument) => {
            const fehler = fehlerText(dokument.errorCode);
            return (
              <li key={dokument.id} className="panel p-4">
                <Link
                  href={`/app/documents/${dokument.id}`}
                  className="underline underline-offset-4"
                >
                  {dokument.filename}
                </Link>

                <p className="text-tinte-leise">
                  {artText(dokument.kind)}, {groesseText(dokument.sizeBytes)}.{' '}
                  {statusText(dokument.status)}
                  {dokument.pageCount !== null && `, ${dokument.pageCount} Seiten`}
                  {dokument.chunkCount !== null && `, ${dokument.chunkCount} Abschnitte`}.
                </p>

                {fehler !== null && (
                  <p role="alert" className="mt-2 text-ink">
                    {fehler}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
