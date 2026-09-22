import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readSession, sitzungsKennung, SESSION_COOKIE } from '@/lib/auth/session';
import { fragenInSitzung, nutzungsprotokoll, nutzungsstand } from '@/lib/budget/budget';
import { PREISSTAND, WAEHRUNG } from '@/lib/budget/preise';
import { env } from '@/lib/config/env';
import { Balken } from './balken';

export const metadata: Metadata = { title: 'Verbrauch – Evidarium' };
export const dynamic = 'force-dynamic';

/*
 * Der Verbrauch steht offen da, nicht in einer Administrationsecke.
 *
 * Eine Demo mit fremdem Schlüssel und ohne sichtbaren Deckel ist eine
 * Einladung; eine, bei der jede fragende Person sieht, wie viel vom Tag noch
 * übrig ist, erklärt sich selbst — auch dann, wenn sie sperrt.
 */

const STATUSTEXT: Record<string, string> = {
  reserviert: 'reserviert',
  abgerechnet: 'abgerechnet',
  unklar: 'unklar – Reservierung bleibt stehen',
};

export default async function VerbrauchPage() {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  const sitzung = await readSession(cookie);
  if (!sitzung || !cookie) redirect('/login');

  const [stand, protokoll, gestellt] = await Promise.all([
    nutzungsstand(),
    nutzungsprotokoll(sitzung.userId),
    fragenInSitzung(sitzungsKennung(cookie)),
  ]);

  /*
   * Zwei Fenster wie überall in der Anwendung: oben die drei Deckel
   * nebeneinander, darunter die Aufrufe als echte Tabelle — Zeitpunkt,
   * Modell, Token und Kosten sind Spalten, keine Sätze.
   */
  return (
    <main id="inhalt" className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6">
      <section aria-labelledby="verbrauch-titel" className="panel overflow-hidden">
        <div className="panel-leiste min-h-[3.25rem] items-center py-1">
          <h1 id="verbrauch-titel" className="text-tinte">
            Verbrauch
          </h1>
          <span className="me-auto">
            Schätzung in {WAEHRUNG}, Preisliste vom {PREISSTAND}
          </span>
        </div>
        <div className="grid gap-6 p-5 md:grid-cols-3">
          <Balken
            name="Heute"
            wert={stand.tagUsd}
            grenze={stand.tagGrenzeUsd}
            text={`${stand.tagUsd.toFixed(4)} von ${stand.tagGrenzeUsd.toFixed(2)} USD`}
          />
          <Balken
            name="Diesen Monat"
            wert={stand.monatUsd}
            grenze={stand.monatGrenzeUsd}
            text={`${stand.monatUsd.toFixed(4)} von ${stand.monatGrenzeUsd.toFixed(2)} USD`}
          />
          <Balken
            name="Diese Anmeldung"
            wert={gestellt}
            grenze={env.FRAGEN_JE_SITZUNG}
            text={`${gestellt} von ${env.FRAGEN_JE_SITZUNG} Fragen`}
          />
        </div>
      </section>

      <section aria-labelledby="aufrufe-titel" className="fenster-voll panel overflow-hidden">
        <div className="panel-leiste min-h-[3.25rem] items-center py-1">
          <h2 id="aufrufe-titel" className="text-tinte">
            Letzte Aufrufe
          </h2>
          <span className="me-auto">{protokoll.length}</span>
        </div>

        {protokoll.length === 0 ? (
          <p className="p-5 text-tinte-leise">
            Noch kein Aufruf. Im Demo-Modus entsteht kein Eintrag – es wird kein Modell gefragt.
          </p>
        ) : (
          /*
           * Schmal rollt die Tabelle seitlich. Ein rollbarer Bereich muss mit
           * der Tastatur erreichbar sein (WCAG 2.1.1, axe
           * `scrollable-region-focusable`) — darum `tabIndex` an einer Region,
           * was die Lint-Regel sonst zu Recht verbietet.
           */
          <div
            role="region"
            aria-labelledby="aufrufe-titel"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            className="fenster-rollt overflow-x-auto"
          >
            <table className="aufrufe">
              <thead>
                <tr>
                  <th scope="col">Zeitpunkt</th>
                  <th scope="col">Modell</th>
                  <th scope="col">Stand</th>
                  <th scope="col" className="zahl">
                    Gelesen
                  </th>
                  <th scope="col" className="zahl">
                    Geschrieben
                  </th>
                  <th scope="col" className="zahl">
                    Kosten
                  </th>
                </tr>
              </thead>
              <tbody>
                {protokoll.map((zeile) => (
                  <tr key={zeile.id}>
                    <td>{zeile.createdAt.toLocaleString('de-CH')}</td>
                    <td>{zeile.modell}</td>
                    <td>{STATUSTEXT[zeile.status] ?? zeile.status}</td>
                    <td className="zahl">{zeile.eingabeTokens?.toLocaleString('de-CH') ?? '–'}</td>
                    <td className="zahl">{zeile.ausgabeTokens?.toLocaleString('de-CH') ?? '–'}</td>
                    <td className="zahl">{zeile.kostenUsd.toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="border-t border-kante px-[1.1rem] py-3 text-tinte-leise">
          Alle Beträge sind Schätzungen. Der Anbieter rechnet nach eigenen Regeln ab;
          zwischengespeicherte Eingaben kosten weniger. Jede Zeile ist nach dem Preisstand ihres
          Aufrufs gerechnet.
        </p>
      </section>
    </main>
  );
}
