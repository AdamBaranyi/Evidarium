import Link from 'next/link';
import { sprache } from '@/lib/i18n/server';
import { abmelden } from './actions';
import { Kopf } from '../_teile/kopf';
import { ANWENDUNG } from './texte';

/*
 * Kopfzeile des angemeldeten Bereichs: dieselbe wie überall, dazu drei Ziele
 * und Abmelden. Kein ausklappbares Menü — drei Ziele brauchen keines.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const t = ANWENDUNG[await sprache()];
  return (
    <div className="seite-rahmen flex flex-1 flex-col">
      <Kopf ziel="/app/chat">
        <nav aria-label={t.navigation} className="flex flex-wrap items-baseline gap-x-7 gap-y-2">
          <Link href="/app/chat" className="underline underline-offset-4">
            {t.fragen}
          </Link>
          <Link href="/app/documents" className="underline underline-offset-4">
            {t.dokumente}
          </Link>
          <Link href="/app/usage" className="underline underline-offset-4">
            {t.verbrauch}
          </Link>
        </nav>

        <form action={abmelden} className="ms-auto">
          <button type="submit" className="min-h-11 underline underline-offset-4">
            {t.abmelden}
          </button>
        </form>
      </Kopf>

      {children}
    </div>
  );
}
