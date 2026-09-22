'use client';

import { useId, useState } from 'react';
import { useSprache, useTexte } from '@/lib/i18n/client';
import { sprachTag, type Sprache } from '@/lib/i18n/sprachen';
import { CHAT } from './texte';
import { URTEIL } from './texte-urteil';
import type { Lauf, Schritt } from './typen';

/*
 * **Keine erfundene Fortschrittsanzeige.**
 *
 * Jede Zeile steht für einen Schritt, der wirklich gelaufen ist, und die Zeit
 * daneben ist gemessen, nicht geschätzt. Ein Balken, der sich von selbst
 * füllt, wäre einfacher zu bauen und würde behaupten, was niemand weiss.
 *
 * Bewusst ohne Bewegung: Die Zeilen erscheinen im Sekundentakt und wechseln
 * schnell. Eine Einblendung darauf wäre Zappeln, kein Hinweis.
 */
export function Schrittanzeige({ schritte, laeuft }: { schritte: Schritt[]; laeuft: boolean }) {
  if (schritte.length === 0) return null;
  return (
    <div aria-live="polite">
      <SchrittListe schritte={schritte} laeuft={laeuft} />
    </div>
  );
}

function SchrittListe({ schritte, laeuft }: { schritte: Schritt[]; laeuft: boolean }) {
  const phasen = useTexte(URTEIL).phasen;
  const sprache = useSprache();
  return (
    <ol className="flex max-w-[26rem] flex-col gap-1 border-l border-kante-stark py-1 pl-4">
      {schritte.map((schritt) => {
        const offen = schritt.dauerMs === null && laeuft;
        return (
          <li key={schritt.phase} className="flex flex-wrap justify-between gap-x-6">
            <span className={offen ? '' : 'text-tinte-leise'}>
              {phasen[schritt.phase]}
              {offen && ' …'}
            </span>
            {schritt.dauerMs !== null && (
              <span className="text-tinte-leise">{sekunden(schritt.dauerMs, sprache)}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Nach der Antwort klappt die Anzeige zu einer Zeile zusammen. Die Schritte
 * bleiben einen Klick entfernt: Wer wissen will, wofür er gewartet hat, soll
 * es nachsehen können, ohne dass es jede Antwort verlängert.
 */
export function SchrittZusammenfassung({ lauf }: { lauf: Lauf }) {
  const [offen, setOffen] = useState(false);
  const liste = useId();
  const t = useTexte(CHAT).antwort;
  const sprache = useSprache();

  return (
    <>
      <button
        type="button"
        aria-expanded={offen}
        aria-controls={liste}
        onClick={() => setOffen(!offen)}
      >
        {t.geprueft(sekunden(lauf.wartezeitMs, sprache))}
      </button>
      <div id={liste} hidden={!offen} className="basis-full pb-2">
        <SchrittListe schritte={lauf.schritte} laeuft={false} />
      </div>
    </>
  );
}

/** Eine Nachkommastelle, im Zahlformat der Sprache: 2.1 s, auf Französisch 2,1 s. */
function sekunden(ms: number, sprache: Sprache): string {
  const zahl = (ms / 1000).toLocaleString(sprachTag(sprache), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${zahl} s`;
}
