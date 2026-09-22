import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readSession, sitzungsKennung, SESSION_COOKIE } from '@/lib/auth/session';
import { fragenInSitzung, nutzungsprotokoll, nutzungsstand } from '@/lib/budget/budget';
import { PREISSTAND, WAEHRUNG } from '@/lib/budget/preise';
import { env } from '@/lib/config/env';
import { sprache } from '@/lib/i18n/server';
import { sprachTag } from '@/lib/i18n/sprachen';
import { Balken } from './balken';
import { VERBRAUCH } from './texte';

export async function generateMetadata(): Promise<Metadata> {
  return { title: VERBRAUCH[await sprache()].metaTitel };
}
export const dynamic = 'force-dynamic';

/*
 * Der Verbrauch steht offen da, nicht in einer Administrationsecke.
 *
 * Eine Demo mit fremdem Schlüssel und ohne sichtbaren Deckel ist eine
 * Einladung; eine, bei der jede fragende Person sieht, wie viel vom Tag noch
 * übrig ist, erklärt sich selbst — auch dann, wenn sie sperrt.
 */

export default async function VerbrauchPage() {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  const sitzung = await readSession(cookie);
  if (!sitzung || !cookie) redirect('/login');

  const s = await sprache();
  const t = VERBRAUCH[s];
  const tag = sprachTag(s);
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
            {t.titel}
          </h1>
          <span className="me-auto">{t.schaetzung(WAEHRUNG, PREISSTAND)}</span>
        </div>
        <div className="grid gap-6 p-5 md:grid-cols-3">
          <Balken
            name={t.heute}
            wert={stand.tagUsd}
            grenze={stand.tagGrenzeUsd}
            text={t.betrag(stand.tagUsd.toFixed(4), stand.tagGrenzeUsd.toFixed(2), WAEHRUNG)}
          />
          <Balken
            name={t.monat}
            wert={stand.monatUsd}
            grenze={stand.monatGrenzeUsd}
            text={t.betrag(stand.monatUsd.toFixed(4), stand.monatGrenzeUsd.toFixed(2), WAEHRUNG)}
          />
          <Balken
            name={t.anmeldung}
            wert={gestellt}
            grenze={env.FRAGEN_JE_SITZUNG}
            text={t.fragen(gestellt, env.FRAGEN_JE_SITZUNG)}
          />
        </div>
      </section>

      <section aria-labelledby="aufrufe-titel" className="fenster-voll panel overflow-hidden">
        <div className="panel-leiste min-h-[3.25rem] items-center py-1">
          <h2 id="aufrufe-titel" className="text-tinte">
            {t.aufrufe}
          </h2>
          <span className="me-auto">{protokoll.length}</span>
        </div>

        {protokoll.length === 0 ? (
          <p className="p-5 text-tinte-leise">{t.keine}</p>
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
                  <th scope="col">{t.spalten.zeitpunkt}</th>
                  <th scope="col">{t.spalten.modell}</th>
                  <th scope="col">{t.spalten.stand}</th>
                  <th scope="col" className="zahl">
                    {t.spalten.gelesen}
                  </th>
                  <th scope="col" className="zahl">
                    {t.spalten.geschrieben}
                  </th>
                  <th scope="col" className="zahl">
                    {t.spalten.kosten}
                  </th>
                </tr>
              </thead>
              <tbody>
                {protokoll.map((zeile) => (
                  <tr key={zeile.id}>
                    <td>{zeile.createdAt.toLocaleString(tag)}</td>
                    <td>{zeile.modell}</td>
                    <td>{(t.status as Record<string, string>)[zeile.status] ?? zeile.status}</td>
                    <td className="zahl">{zeile.eingabeTokens?.toLocaleString(tag) ?? '–'}</td>
                    <td className="zahl">{zeile.ausgabeTokens?.toLocaleString(tag) ?? '–'}</td>
                    <td className="zahl">{zeile.kostenUsd.toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="border-t border-kante px-[1.1rem] py-3 text-tinte-leise">{t.hinweis}</p>
      </section>
    </main>
  );
}
