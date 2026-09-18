import Link from 'next/link';
import { demoBereit } from '@/lib/demo/korpus';
import { Vorfuehrung } from './start/vorfuehrung';

// Ob die Demo bereitsteht, entscheidet sich am Korpus in der Datenbank.
export const dynamic = 'force-dynamic';

/*
 * Die Startseite zeigt **das Produkt bei der Arbeit**, nicht eine Behauptung
 * darüber. Rechts läuft eine Frage durch: einbetten, suchen, antworten,
 * Belege prüfen — bis die Antwort mit ihrem Blatt dasteht.
 *
 * Das Beispiel stammt aus dem erfundenen Korpus und sagt das auch. Ein
 * Produkt, das Nachprüfbarkeit verspricht, darf auf seiner eigenen Startseite
 * nichts vorführen, was es nicht belegen kann.
 */
export default async function StartPage() {
  const demo = await demoBereit();

  return (
    /* `overflow-x-clip`, weil das Blatt rechts über das Fenster hinausragt. */
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <header className="border-b border-kante bg-flaeche-tief">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-baseline gap-x-7 gap-y-2 px-6 py-4">
          <p className="font-blatt text-lg">Evidarium</p>
          <Link href="/login" className="ms-auto underline underline-offset-4">
            Anmelden
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-14 px-6 py-14 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16">
        <div className="flex flex-col gap-7">
          <h1 className="max-w-[15ch] text-2xl leading-[var(--line-title)]">
            Antworten aus deinen Dokumenten, mit Quellen zum Nachlesen.
          </h1>

          <p className="max-w-[var(--mass)] text-lg text-tinte-leise">
            Nachprüfbarkeit, nicht Unfehlbarkeit: Jede Aussage trägt ein wörtliches Zitat, und ein
            Klick öffnet die Stelle im Dokument. Findet sich keine Grundlage, sagt Evidarium das,
            statt etwas zu erfinden.
          </p>

          <nav
            aria-label="Einstieg"
            className="flex flex-wrap items-center gap-x-4 gap-y-3 text-lg"
          >
            {demo && (
              <Link href="/demo" className="min-h-11 bg-aktion-grund px-5 py-2.5 text-aktion-tinte">
                Ohne Anmeldung ausprobieren
              </Link>
            )}
            <Link href="/login" className="min-h-11 px-3 py-2.5 underline underline-offset-4">
              Anmelden
            </Link>
          </nav>
        </div>

        <section aria-label="Evidarium bei der Arbeit" className="flex flex-col gap-4">
          <Vorfuehrung />
          <p className="pt-2 text-tinte-leise lg:pt-10">
            Beispiel aus dem Korpus der erfundenen Firma Nordstern Digital, gegen den auch die
            Evaluation läuft.
          </p>
        </section>
      </main>
    </div>
  );
}
