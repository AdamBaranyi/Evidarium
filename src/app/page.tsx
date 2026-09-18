import Link from 'next/link';
import { demoBereit } from '@/lib/demo/korpus';

// Ob die Demo bereitsteht, entscheidet sich am Korpus in der Datenbank.
export const dynamic = 'force-dynamic';

export default async function StartPage() {
  const demo = await demoBereit();

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-4 py-12">
      <h1 className="text-2xl leading-tight">Evidarium</h1>
      <p className="text-lg text-ink-soft">
        Antworten aus deinen Dokumenten – mit Quellen, die du nachlesen kannst.
      </p>
      <p>
        Das Produkt verspricht Nachprüfbarkeit, nicht Unfehlbarkeit: Jede Aussage trägt eine
        Fundstelle, die sich im Originaldokument öffnen lässt.
      </p>

      <p className="flex flex-wrap gap-x-6 gap-y-2">
        {demo && (
          <Link href="/demo" className="text-beleg underline underline-offset-4">
            Ohne Anmeldung ausprobieren
          </Link>
        )}
        <Link href="/login" className="text-beleg underline underline-offset-4">
          Anmelden
        </Link>
      </p>
    </main>
  );
}
