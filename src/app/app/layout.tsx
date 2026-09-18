import Link from 'next/link';
import { abmelden } from './actions';

/*
 * Kopfzeile des angemeldeten Bereichs: Wortmarke, drei Ziele, Abmelden.
 *
 * Die Wortmarke steht in der Dokumentschrift — als einzige Stelle ausserhalb
 * eines Blatts. Der Name meint den Ort, an dem Belege liegen; ihn im
 * Material der Belege zu setzen, ist keine Zierde, sondern die Aussage.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-kante bg-flaeche-tief">
        <nav
          aria-label="Hauptnavigation"
          className="mx-auto flex w-full max-w-6xl flex-wrap items-baseline gap-x-7 gap-y-2 px-6 py-4"
        >
          <Link href="/app/chat" className="wortmarke">
            Evidarium
          </Link>

          <Link href="/app/chat" className="underline underline-offset-4">
            Fragen
          </Link>
          <Link href="/app/documents" className="underline underline-offset-4">
            Dokumente
          </Link>
          <Link href="/app/usage" className="underline underline-offset-4">
            Verbrauch
          </Link>

          <form action={abmelden} className="ms-auto">
            <button type="submit" className="min-h-11 underline underline-offset-4">
              Abmelden
            </button>
          </form>
        </nav>
      </header>

      {children}
    </div>
  );
}
