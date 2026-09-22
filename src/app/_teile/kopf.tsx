import Link from 'next/link';
import { Sprachwahl } from './sprachwahl';

/*
 * Eine Kopfzeile für alle Seiten.
 *
 * Vorher hatten Startseite, Demo, Anwendung und Anmeldung je eine eigene —
 * oder, bei der Anmeldung, gar keine. Befund S10 im Prüfbericht. Gleich ist
 * jetzt alles, was man wiedererkennen soll: Wortmarke links, Höhe, Linie,
 * Grund. Verschieden ist nur, was an der Stelle wirklich anders ist.
 */
export function Kopf({
  ziel = '/',
  unterzeile,
  children,
}: {
  /** Wohin die Wortmarke führt. */
  ziel?: string;
  /** Wo man ist, etwa «Demo». */
  unterzeile?: string;
  /** Navigation und Aktionen rechts. */
  children?: React.ReactNode;
}) {
  return (
    <header className="border-b border-kante bg-flaeche-tief">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-7 gap-y-2 px-6 py-3">
        <Link href={ziel} className="wortmarke">
          Evidarium
        </Link>
        {unterzeile !== undefined && <p className="text-tinte-leise">{unterzeile}</p>}
        {children}
        {/* Ohne eigene Aktionen rechts rückt die Sprachwahl selbst nach rechts. */}
        <Sprachwahl rechts={children === undefined} />
      </div>
    </header>
  );
}
