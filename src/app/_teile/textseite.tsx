import { sprache } from '@/lib/i18n/server';
import { Kopf } from './kopf';
import { GEMEINSAM } from './texte';

/*
 * Rahmen für Textseiten: Impressum, Datenschutz, Barrierefreiheit.
 *
 * Eine Spalte mit Lesemass, eigene Kopfzeile, Überschriften in klarer Stufe.
 * Rechtstexte werden gelesen, wenn es darauf ankommt — dann soll nichts
 * davon ablenken.
 */
export async function Textseite({
  titel,
  stand,
  children,
}: {
  titel: string;
  /** Datum der letzten inhaltlichen Änderung. */
  stand: string;
  children: React.ReactNode;
}) {
  const t = GEMEINSAM[await sprache()];
  return (
    <div className="flex flex-1 flex-col">
      <Kopf />
      <main id="inhalt" className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <article className="textseite flex max-w-[var(--mass-blatt)] flex-col gap-4">
          <h1 className="text-xl leading-[var(--line-title)]">{titel}</h1>
          <p className="text-tinte-leise">{t.stand(stand)}</p>
          {t.originalGilt !== '' && <p className="panel p-4">{t.originalGilt}</p>}
          {children}
        </article>
      </main>
    </div>
  );
}

/** Angaben des Betreibers — oder ein ehrlicher Hinweis, dass sie fehlen. */
export async function Betreiber({
  name,
  adresse,
  email,
}: {
  name: string | undefined;
  adresse: string | undefined;
  email: string | undefined;
}) {
  if (!name || !adresse || !email) {
    return <p className="panel p-4">{GEMEINSAM[await sprache()].betreiberFehlt}</p>;
  }
  return (
    <address className="not-italic">
      {name}
      <br />
      {adresse}
      <br />
      <a href={`mailto:${email}`} className="underline underline-offset-4">
        {email}
      </a>
    </address>
  );
}
