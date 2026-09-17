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

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl leading-tight">Verbrauch</h1>

      <p className="text-ink-soft">
        Alle Beträge sind Schätzungen nach der hinterlegten Preisliste vom {PREISSTAND} in{' '}
        {WAEHRUNG}. Der Anbieter rechnet nach eigenen Regeln ab; zwischengespeicherte Eingaben
        kosten weniger.
      </p>

      <section className="flex flex-col gap-4 border border-edge bg-surface p-4">
        <h2 className="text-xl leading-tight">Deckel</h2>
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
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl leading-tight">Letzte Aufrufe</h2>

        {protokoll.length === 0 ? (
          <p className="text-ink-soft">
            Noch kein Aufruf. Im Demo-Modus entsteht kein Eintrag – es wird kein Modell gefragt.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {protokoll.map((zeile) => (
              <li key={zeile.id} className="border border-edge bg-surface p-4">
                <p>
                  {zeile.createdAt.toLocaleString('de-CH')} · {zeile.modell}
                </p>
                <p className="text-ink-soft">
                  {STATUSTEXT[zeile.status] ?? zeile.status} ·{' '}
                  {zeile.eingabeTokens === null
                    ? 'keine Messwerte'
                    : `${zeile.eingabeTokens.toLocaleString('de-CH')} Token ein · ${(
                        zeile.ausgabeTokens ?? 0
                      ).toLocaleString('de-CH')} Token aus`}{' '}
                  · {zeile.kostenUsd.toFixed(6)} USD · Preisstand {zeile.preisstand}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
