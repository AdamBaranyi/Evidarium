import Link from 'next/link';
import { abmelden } from './actions';

/*
 * Eine Navigationsleiste für den angemeldeten Bereich. Sie besteht aus Links
 * und einem Knopf — kein ausklappbares Menü, weil drei Ziele keines brauchen.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-edge bg-surface">
        <nav
          aria-label="Hauptnavigation"
          className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3"
        >
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
