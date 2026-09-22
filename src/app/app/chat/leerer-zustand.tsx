'use client';

import { useTexte } from '@/lib/i18n/client';
import { CHAT } from './texte';
import { URTEIL } from './texte-urteil';
import { KATEGORIEWERT, type Antwort } from './typen';

/*
 * Was im Chat steht, bevor jemand fragt.
 *
 * Eine leere Fläche mit einem Textfeld sagt nur «schreib etwas». Hier steht,
 * was die Anwendung kann, woran man ihre Urteile erkennt — und in der Demo,
 * was sich auszuprobieren lohnt.
 */

export type Vorschlag = {
  frage: string;
  /** Was an diesem Fall besonders ist, in einem Satz. */
  fall: string;
};

const URTEILE: Antwort['kategorie'][] = [
  'belegt',
  'teilweise_belegt',
  'keine_grundlage',
  'widerspruch',
];

export function LeererZustand({
  titel,
  einleitung,
  vorschlaege,
  fragen,
  modellAktiv,
}: {
  titel: string;
  einleitung: string;
  vorschlaege: Vorschlag[];
  fragen: (frage: string) => void;
  /** Ohne Modell zeigt Evidarium nur die passendste Stelle. Das steht dann hier. */
  modellAktiv: boolean;
}) {
  const t = useTexte(CHAT).leer;
  const kurz = useTexte(URTEIL).urteilKurz;
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        {/* h2: Die h1 der Seite steht über dem Fenster und bleibt, wenn der Chat nicht mehr leer ist. */}
        <h2 className="text-xl leading-[var(--line-title)]">{titel}</h2>
        <p className="max-w-[var(--mass)] text-tinte-leise">{einleitung}</p>
        {!modellAktiv && <p className="max-w-[var(--mass)] text-tinte-leise">{t.ohneModell}</p>}
      </div>

      {vorschlaege.length > 0 && (
        <ul className="vorschlaege" aria-label={t.vorschlaege} data-rundgang="vorschlaege">
          {vorschlaege.map((vorschlag) => (
            <li key={vorschlag.frage}>
              <button type="button" className="vorschlag" onClick={() => fragen(vorschlag.frage)}>
                <span className="vorschlag-frage">{vorschlag.frage}</span>
                <span className="vorschlag-fall">{vorschlag.fall}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div data-rundgang="legende" className="flex flex-col gap-2">
        <p className="text-tinte-leise">{t.legende}</p>
        <ul className="legende">
          {URTEILE.map((urteil) => (
            <li key={urteil}>
              <span
                aria-hidden
                className="urteil-punkt"
                style={{ background: KATEGORIEWERT[urteil] }}
              />
              {kurz[urteil]}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
