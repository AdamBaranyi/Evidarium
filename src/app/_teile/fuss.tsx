import Link from 'next/link';

/*
 * Die Fusszeile — vorher gab es keine, auf keiner Seite. Befund S3.
 *
 * Sie trägt, was eine öffentliche Seite in der Schweiz braucht und was
 * jemand sucht, der dem Projekt nachgehen will: Impressum, Datenschutz,
 * Barrierefreiheit, Quelltext. Keine vierspaltige Fusszeile mit
 * Sozialsymbolen — vier Links reichen.
 */
export function Fuss() {
  return (
    <footer className="border-t border-kante bg-flaeche-tief">
      <nav
        aria-label="Rechtliches und Quelltext"
        className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-7 gap-y-2 px-6 py-5"
      >
        <Link href="/impressum" className="underline underline-offset-4">
          Impressum
        </Link>
        <Link href="/datenschutz" className="underline underline-offset-4">
          Datenschutz
        </Link>
        <Link href="/barrierefreiheit" className="underline underline-offset-4">
          Barrierefreiheit
        </Link>
        <a
          href="https://github.com/AdamBaranyi/Evidarium"
          className="underline underline-offset-4"
          rel="noopener"
        >
          Quelltext
        </a>
      </nav>
    </footer>
  );
}
