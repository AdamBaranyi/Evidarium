import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readSession, SESSION_COOKIE } from '@/lib/auth/session';
import { dokumenteListen } from '@/lib/documents/abfragen';
import { GRENZEN } from '@/lib/documents/grenzen';
import { artText, fehlerText, groesseText, inArbeit, statusText } from '@/lib/documents/zustaende';
import { projekteListen } from '@/lib/projekte/projekte';
import { DateiKnopf } from '../../_teile/datei-knopf';
import { Nachladen } from '../../_teile/nachladen';
import { DokumentProjekt } from './dokument-projekt';
import { ProjektEintrag } from './projekt-eintrag';
import { ProjektNeu } from './projekt-neu';

export const metadata: Metadata = { title: 'Dokumente – Evidarium' };

// Die Liste zeigt Verarbeitungsstände; ein zwischengespeicherter Stand wäre
// sofort falsch.
export const dynamic = 'force-dynamic';

export default async function DokumentePage() {
  const sitzung = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!sitzung) redirect('/login');

  const [dokumente, projekte] = await Promise.all([
    dokumenteListen(sitzung.userId),
    projekteListen(sitzung.userId),
  ]);

  /*
   * Eine Liste in einem Fenster, keine Kartenreihe: Elf gleiche Karten
   * untereinander sind ein Muster, kein Inhalt. Die Zeilen tragen, was man
   * über ein Dokument wissen will — Name, Art, Grösse, Stand —, und das
   * Fenster hat dieselbe Leiste wie der Chat.
   */
  return (
    <main id="inhalt" className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6">
      <Nachladen aktiv={dokumente.some((d) => inArbeit(d.status))} />

      <section aria-labelledby="dokumente-titel" className="fenster-voll panel overflow-hidden">
        <div className="panel-leiste min-h-[3.25rem] items-center py-1">
          <h1 id="dokumente-titel" className="text-tinte">
            Dokumente
          </h1>
          <span className="me-auto">
            {dokumente.length === 1 ? '1 Dokument' : `${dokumente.length} Dokumente`}
          </span>
          <DateiKnopf
            id="dokument-datei"
            endpunkt="/api/documents"
            beschriftung="Dokument hinzufügen"
          />
        </div>

        {/*
         * Links die Projekte, rechts alle Dokumente mit ihrem Projekt. Die
         * Liste filtert bewusst nicht: Wer ein Dokument verschiebt, soll es
         * danach an derselben Stelle sehen, und der Fokus bleibt, wo er war.
         * Nach Projekt eingegrenzt wird beim Fragen.
         */}
        <div className="chat-rumpf">
          <aside aria-labelledby="projekte-titel" className="chat-spalte flex">
            <div className="flex flex-col gap-1">
              <h2 id="projekte-titel">Projekte</h2>
              <p className="text-tinte-leise">
                Gruppen von Dokumenten. Beim Fragen lässt sich die Suche auf ein Projekt eingrenzen.
              </p>
            </div>
            {projekte.length > 0 && (
              <ul className="flex flex-col">
                {projekte.map((projekt) => (
                  <ProjektEintrag key={projekt.id} projekt={projekt} />
                ))}
              </ul>
            )}
            <ProjektNeu />
          </aside>

          {dokumente.length === 0 ? (
            <p className="p-5 text-tinte-leise">
              Noch keine Dokumente. Lade ein PDF, eine Textdatei oder Markdown hoch.
            </p>
          ) : (
            <ul className="dokument-liste rollt">
              {dokumente.map((dokument) => {
                const fehler = fehlerText(dokument.errorCode);
                return (
                  <li key={dokument.id} className="dokument-zeile">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <Link
                        href={`/app/documents/${dokument.id}`}
                        className="underline underline-offset-4"
                      >
                        {dokument.filename}
                      </Link>
                      <p className="text-tinte-leise">
                        {artText(dokument.kind)}, {groesseText(dokument.sizeBytes)}
                        {dokument.pageCount !== null && `, ${dokument.pageCount} Seiten`}
                        {dokument.chunkCount !== null &&
                          `, ${dokument.chunkCount} Abschnitte`}.{' '}
                        <span className={inArbeit(dokument.status) ? 'text-tinte' : ''}>
                          {statusText(dokument.status)}
                        </span>
                      </p>
                      {fehler !== null && (
                        <p role="alert" className="text-tinte">
                          {fehler}
                        </p>
                      )}
                    </div>
                    <DokumentProjekt
                      documentId={dokument.id}
                      dateiname={dokument.filename}
                      projektId={dokument.projectId}
                      projekte={projekte}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className="border-t border-kante px-[1.1rem] py-3 text-tinte-leise">
          PDF mit Textschicht, TXT oder Markdown. Höchstens {GRENZEN.maxBytes / 1024 / 1024} MiB und{' '}
          {GRENZEN.maxSeiten} Seiten.
        </p>
      </section>
    </main>
  );
}
