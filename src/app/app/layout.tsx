import Link from 'next/link';
import { abmelden } from './actions';
import { Kopf } from '../_teile/kopf';

/*
 * Kopfzeile des angemeldeten Bereichs: dieselbe wie überall, dazu drei Ziele
 * und Abmelden. Kein ausklappbares Menü — drei Ziele brauchen keines.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <Kopf ziel="/app/chat">
        <nav aria-label="Hauptnavigation" className="flex flex-wrap items-baseline gap-x-7 gap-y-2">
          <Link href="/app/chat" className="underline underline-offset-4">
            Fragen
          </Link>
          <Link href="/app/documents" className="underline underline-offset-4">
            Dokumente
          </Link>
          <Link href="/app/usage" className="underline underline-offset-4">
            Verbrauch
          </Link>
        </nav>

        <form action={abmelden} className="ms-auto">
          <button type="submit" className="min-h-11 underline underline-offset-4">
            Abmelden
          </button>
        </form>
      </Kopf>

      {children}
    </div>
  );
}
