'use client';

import { kostenSchaetzen } from '@/lib/budget/preise';
import type { PanelInhalt } from './quellen-panel';
import { KATEGORIEERKLAERUNG, KATEGORIETEXT, type Antwort } from './typen';

/*
 * Eine geprüfte Antwort.
 *
 * Der Aufbau folgt dem, was das Produkt verspricht: Die Anwendung sagt einen
 * Satz — in ihrer Schrift, auf ihrem Grund —, und direkt darunter liegt das
 * **Blatt** mit dem Wortlaut aus dem Dokument. Zwei Materialien, zwei
 * Schriften; man muss nicht erklären, was wovon stammt.
 *
 * Kein Etikett über der Antwort, keine Plakette mit der Kategorie. Die
 * Kategorie steht als Satz da, weil sie ein Urteil ist und kein Merkmal.
 */

export function AntwortKarte({
  antwort,
  oeffnen,
}: {
  antwort: Antwort;
  oeffnen: (inhalt: PanelInhalt) => void;
}) {
  const stellen = new Map(antwort.stellen.map((s) => [s.sourceId, s]));

  /*
   * Beim Widerspruch stehen die Blätter nebeneinander, sobald Platz ist.
   * Untereinander läse sich das eine als Antwort und das andere als
   * Nachtrag — nebeneinander sieht man, dass beide gleich gelten.
   */
  const gegenueber = antwort.kategorie === 'widerspruch';

  return (
    <article className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h3 className="text-lg leading-tight">{KATEGORIETEXT[antwort.kategorie]}</h3>
        <p className="max-w-[var(--mass)] text-tinte-leise">
          {KATEGORIEERKLAERUNG[antwort.kategorie]}
          {antwort.demo && ' Diese Antwort stammt aus dem Demo-Adapter, es lief kein Modell.'}
        </p>
      </header>

      {antwort.aussagen.map((aussage, i) => (
        <div key={i} className="flex flex-col gap-3">
          <p className="max-w-[var(--mass)] text-lg leading-snug">{aussage.text}</p>

          {aussage.belege.length > 0 && (
            <ul
              className={
                gegenueber
                  ? 'grid gap-4 md:grid-cols-2'
                  : 'flex flex-col gap-4 md:max-w-[var(--mass-blatt)]'
              }
            >
              {aussage.belege.map((beleg, j) => {
                const stelle = stellen.get(beleg.sourceId);
                if (!stelle) return null;
                return (
                  <li key={j}>
                    <Belegblatt
                      dateiname={stelle.filename}
                      seite={stelle.page}
                      zitat={beleg.zitat}
                      versatz={j}
                      oeffnen={() => oeffnen({ stelle, zitat: beleg.zitat })}
                    />
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
 * Ein Blatt aus dem Dokument.
 *
 * Der ganze Körper ist die Schaltfläche: Wer den Wortlaut liest und ihn
 * nachschlagen will, klickt dorthin, wo er liest — nicht auf einen Link
 * daneben.
 */
function Belegblatt({
  dateiname,
  seite,
  zitat,
  versatz,
  oeffnen,
}: {
  dateiname: string;
  seite: number | null;
  zitat: string;
  /** Platz in der Liste; erzeugt den Versatz beim Eintreten. */
  versatz: number;
  oeffnen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={oeffnen}
      /*
       * 50 ms Versatz je Blatt, gedeckelt bei dreien: Alles gleichzeitig
       * einzublenden liest sich als Ruck, mehr als drei Stufen als Warteschlange.
       */
      style={{ animationDelay: `${Math.min(versatz, 3) * 50}ms` }}
      className="blatt blatt-ein blatt-knopf flex w-full flex-col gap-3 p-4 text-left"
    >
      <span className="flex items-baseline justify-between gap-4 border-b border-blatt-kante pb-2">
        <span className="text-blatt-leise">{dateiname}</span>
        {seite !== null && <span className="folio shrink-0">{seite}</span>}
      </span>

      <q className="before:content-['«'] after:content-['»']">{zitat}</q>
    </button>
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
    <p className="max-w-[var(--mass)] border-t border-kante pt-3 text-tinte-leise">
      {verbrauch.modell} hat {verbrauch.eingabeTokens.toLocaleString('de-CH')} Token gelesen und{' '}
      {verbrauch.ausgabeTokens.toLocaleString('de-CH')} geschrieben
      {kosten !== null && `, geschätzt ${kosten.toFixed(4)} USD`}.
    </p>
  );
}
