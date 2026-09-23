import Link from 'next/link';
import { sprache } from '@/lib/i18n/server';
import { GEMEINSAM } from './texte';

/*
 * Die Fusszeile — vorher gab es keine, auf keiner Seite. Befund S3.
 *
 * Sie trägt, was eine öffentliche Seite in der Schweiz braucht und was
 * jemand sucht, der dem Projekt nachgehen will: Impressum, Datenschutz,
 * Barrierefreiheit, Quelltext. Keine vierspaltige Fusszeile mit
 * Sozialsymbolen — vier Links reichen.
 */
export async function Fuss() {
  const t = GEMEINSAM[await sprache()].fuss;
  return (
    <footer className="fuss border-t border-kante bg-flaeche-tief">
      <nav
        aria-label={t.label}
        className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-7 gap-y-2 px-6 py-5"
      >
        <Link href="/impressum" className="underline underline-offset-4">
          {t.impressum}
        </Link>
        <Link href="/datenschutz" className="underline underline-offset-4">
          {t.datenschutz}
        </Link>
        <Link href="/barrierefreiheit" className="underline underline-offset-4">
          {t.barrierefreiheit}
        </Link>
        <a
          href="https://github.com/AdamBaranyi/Evidarium"
          className="underline underline-offset-4"
          rel="noopener"
        >
          {t.quelltext}
        </a>
      </nav>
    </footer>
  );
}
