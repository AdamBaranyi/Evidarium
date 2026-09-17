'use client';

import { kostenSchaetzen } from '@/lib/budget/preise';
import type { PanelInhalt } from './quellen-panel';
import { herkunft, KATEGORIEERKLAERUNG, KATEGORIETEXT, type Antwort } from './typen';

/*
 * Eine geprüfte Antwort.
 *
 * Der Beleg steht **bei der Aussage**, nicht in einer Liste am Ende. Eine
 * Sammelliste liesse offen, welcher Satz woher stammt — und genau das ist die
 * Frage, die dieses Produkt beantworten soll.
 */

export function AntwortKarte({
  antwort,
  oeffnen,
}: {
  antwort: Antwort;
  oeffnen: (inhalt: PanelInhalt) => void;
}) {
  const stellen = new Map(antwort.stellen.map((s) => [s.sourceId, s]));

  return (
    <article className="flex flex-col gap-4 border border-edge bg-surface p-4">
      <header className="flex flex-col gap-1">
        <p className="flex flex-wrap items-center gap-2">
          <span className="border border-edge px-2 py-1">{KATEGORIETEXT[antwort.kategorie]}</span>
          {antwort.demo && (
            <span className="border border-edge px-2 py-1 text-ink-soft">
              Demo-Antwort, kein Modellaufruf
            </span>
          )}
        </p>
        <p className="text-ink-soft">{KATEGORIEERKLAERUNG[antwort.kategorie]}</p>
      </header>

      {antwort.aussagen.map((aussage, i) => (
        <div key={i} className="flex flex-col gap-2">
          <p>{aussage.text}</p>

          {aussage.belege.length > 0 && (
            <ul className="flex flex-col gap-2">
              {aussage.belege.map((beleg, j) => {
                const stelle = stellen.get(beleg.sourceId);
                if (!stelle) return null;
                const ort = herkunft(stelle);
                return (
                  <li key={j}>
                    <button
                      type="button"
                      onClick={() => oeffnen({ stelle, zitat: beleg.zitat })}
                      className="flex min-h-11 w-full flex-col gap-1 border-l-2 border-beleg bg-[var(--ground)] px-3 py-2 text-left"
                    >
                      <span className="text-beleg underline underline-offset-4">
                        {stelle.filename}
                        {ort !== null && ` · ${ort}`}
                      </span>
                      <span className="text-ink-soft">«{beleg.zitat}»</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}

      {antwort.verbrauch !== null && <Verbrauch verbrauch={antwort.verbrauch} />}
    </article>
  );
}

/**
 * Was diese eine Antwort gekostet hat.
 *
 * Ausdrücklich als Schätzung bezeichnet: Der Anbieter rechnet nach eigenen
 * Regeln ab, zwischengespeicherte Eingaben kosten anders. Eine Zahl ohne
 * dieses Wort wäre eine Behauptung, die niemand einlösen kann.
 */
function Verbrauch({ verbrauch }: { verbrauch: NonNullable<Antwort['verbrauch']> }) {
  const kosten = kostenSchaetzen(
    verbrauch.modell,
    verbrauch.eingabeTokens,
    verbrauch.ausgabeTokens,
  );

  return (
    <p className="border-t border-edge pt-3 text-ink-soft">
      {verbrauch.modell} · {verbrauch.eingabeTokens.toLocaleString('de-CH')} Token ein ·{' '}
      {verbrauch.ausgabeTokens.toLocaleString('de-CH')} Token aus
      {kosten !== null && ` · geschätzt ${kosten.toFixed(4)} USD`}
    </p>
  );
}
