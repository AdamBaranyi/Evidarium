import Link from 'next/link';
import { demoBereit } from '@/lib/demo/korpus';

// Ob die Demo bereitsteht, entscheidet sich am Korpus in der Datenbank.
export const dynamic = 'force-dynamic';

/*
 * Die Startseite zeigt **das Produkt selbst**, nicht eine Behauptung darüber:
 * links, was Evidarium verspricht — rechts, wie eine Antwort aussieht, gebaut
 * aus denselben Bauteilen wie die Anwendung. Kein Bildschirmfoto, keine
 * nachgestellte Grafik.
 *
 * Das Beispiel stammt aus dem erfundenen Korpus und sagt das auch. Ein
 * Produkt, das Nachprüfbarkeit verspricht, darf auf seiner eigenen Startseite
 * nichts vorführen, was es nicht belegen kann.
 */
export default async function StartPage() {
  const demo = await demoBereit();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-center gap-12 px-6 py-16 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,6fr)] lg:items-center lg:gap-16">
      <div className="flex flex-col gap-7">
        <p className="font-blatt text-lg">Evidarium</p>

        <h1 className="max-w-[16ch] text-2xl leading-[var(--line-title)]">
          Antworten aus deinen Dokumenten, mit Quellen zum Nachlesen.
        </h1>

        <p className="max-w-[var(--mass)] text-lg text-tinte-leise">
          Nachprüfbarkeit, nicht Unfehlbarkeit: Jede Aussage trägt ein wörtliches Zitat, und ein
          Klick öffnet die Stelle im Dokument. Findet sich keine Grundlage, sagt Evidarium das,
          statt etwas zu erfinden.
        </p>

        <nav aria-label="Einstieg" className="flex flex-wrap items-center gap-x-8 gap-y-3 text-lg">
          {demo && (
            <Link href="/demo" className="underline underline-offset-4">
              Ohne Anmeldung ausprobieren
            </Link>
          )}
          <Link href="/login" className="underline underline-offset-4">
            Anmelden
          </Link>
        </nav>
      </div>

      <section aria-label="Beispiel einer Antwort" className="flex flex-col gap-4">
        <p className="text-lg leading-snug">Beim Onboarding hilft Mara Keller.</p>

        <div className="blatt flex flex-col gap-3 p-5">
          <span className="flex items-baseline justify-between gap-4 border-b border-blatt-kante pb-2">
            <span className="text-blatt-leise">Teamhandbuch.pdf</span>
            <span className="folio shrink-0">2</span>
          </span>
          <p className="text-blatt-leise">
            Die ersten beiden Wochen sind als Einarbeitung geplant.{' '}
            <mark className="bg-blatt-markierung text-blatt-tinte">
              Beim Onboarding hilft Mara Keller.
            </mark>{' '}
            Zugaenge werden vor dem ersten Arbeitstag vorbereitet.
          </p>
        </div>

        <p className="text-tinte-leise">
          So sieht ein Beleg aus: der ganze Abschnitt, das Zitat an seiner Stelle. Beispiel aus dem
          Korpus der erfundenen Firma Nordstern Digital.
        </p>
      </section>
    </main>
  );
}
