import type { Metadata } from 'next';
import { LoginForm } from './form';
import { Kopf } from '../_teile/kopf';
import { Licht } from '../_teile/licht';

export const metadata: Metadata = { title: 'Anmelden – Evidarium' };

/*
 * Die Anmeldeseite ist für viele der erste Eindruck. Sie zeigt darum, worum
 * es geht — ein Blatt mit einer Fundstelle —, statt ein Formular auf leerer
 * Fläche. Seit dem Prüfbericht mit derselben Kopfzeile wie alle anderen
 * Seiten; vorher hatte sie keine.
 *
 * **Ohne Bewegung.** Eine Seite, die man oft sieht, darf nicht jedes Mal
 * etwas aufführen. Farbe ja: Das Beispielblatt ist ein belegtes Zitat, und
 * das Licht der Seite steht in dessen Farbe — still.
 */
export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Licht />
      <Kopf />

      <main
        id="inhalt"
        className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-10 px-6 py-12 md:grid md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:items-center md:gap-14"
      >
        <div className="flex flex-col gap-6">
          <h1 className="text-xl leading-[var(--line-title)]">Anmelden</h1>
          <LoginForm />
        </div>

        <aside
          aria-label="Beispiel einer Fundstelle"
          data-urteil="belegt"
          className="flex flex-col gap-3"
        >
          <div className="blatt flex flex-col gap-3 p-5">
            <span className="flex items-baseline justify-between gap-4 border-b border-blatt-kante pb-2">
              <span className="text-blatt-leise">Supportprozess.pdf</span>
              <span className="folio shrink-0">2</span>
            </span>
            <p className="text-blatt-leise">
              Meldungen kommen über das Ticketsystem herein.{' '}
              <mark className="bg-blatt-markierung text-blatt-tinte">
                Die interne Zielreaktion auf kritische Stoerungen betraegt zwei Stunden.
              </mark>{' '}
              Das Servicefenster ist 09:00 bis 17:00 Uhr an Werktagen.
            </p>
          </div>
          <p className="text-tinte-leise">
            So sieht ein Beleg aus: der ganze Abschnitt, das Zitat an seiner Stelle. Beispiel aus
            dem Korpus der erfundenen Firma Nordstern Digital.
          </p>
        </aside>
      </main>
    </div>
  );
}
