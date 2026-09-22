'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';
import {
  ausschnitt,
  karteSetzen,
  mussRollen,
  rollstandMerken,
  sichtbarerTeil,
  zielFinden,
  type Kasten,
  type Platz,
} from './lage';

export type Lage = {
  /** Der helle Ausschnitt; `null` heisst: Der Schritt steht in der Mitte. */
  loch: Kasten | null;
  karte: Platz;
  /** Erst nach der ersten Messung sichtbar, sonst springt die Karte. */
  gemessen: boolean;
};

/** Wohin ein verdecktes Ziel rückt: so weit vom oberen Rand, dass der Rahmen Platz hat. */
const OBEN = 24;

const UNGEMESSEN: Lage = {
  loch: null,
  karte: { top: 0, left: 0, verdeckt: false },
  gemessen: false,
};

/*
 * Misst Ziel und Karte und legt beide fest — neu bei allem, was das Ziel
 * verschieben kann: Fenstergrösse, Rollen, nachgeladene Inhalte und die
 * Schrift, die erst nach dem ersten Zeichnen da ist.
 *
 * Ist vom Ziel zu wenig zu sehen, rollt es einmal herein, ohne Animation:
 * Eine Karte, die neben einem wandernden Ziel mitwandert, liest niemand.
 * Wo es vorher stand, merkt sich `rollstand` für das Ende des Rundgangs.
 */
export function useLage(
  ziele: readonly string[],
  karte: RefObject<HTMLElement | null>,
  rollstand: Map<Element, number>,
): Lage {
  const [lage, setLage] = useState(UNGEMESSEN);

  useLayoutEffect(() => {
    let bild = 0;
    let gerollt = false;
    let hochgerollt = false;
    let aktiv = true;

    const messen = () => {
      if (!aktiv) return;
      cancelAnimationFrame(bild);
      bild = requestAnimationFrame(() => {
        const fenster = { width: document.documentElement.clientWidth, height: window.innerHeight };
        const ziel = zielFinden(ziele);
        if (ziel && !gerollt && mussRollen(ziel.getBoundingClientRect(), sichtbarerTeil(ziel))) {
          gerollt = true;
          rollstandMerken(ziel, rollstand);
          // Mitte statt Rand: Am unteren Rand läge das Ziel schmal unter dem Eingabefeld.
          ziel.scrollIntoView({ block: 'center', behavior: 'instant' });
        }
        const kasten = ziel ? sichtbarerTeil(ziel) : undefined;
        const loch = kasten && kasten.height > 0 ? ausschnitt(kasten, fenster) : null;
        const masse = karte.current?.getBoundingClientRect();
        const groesse = { width: masse?.width ?? 0, height: masse?.height ?? 0 };
        const platz = karteSetzen(loch, groesse, fenster);

        /*
         * Bei 320 Pixeln passt die Karte oft weder unter noch über das Ziel
         * und verdeckt es. Dann rückt das Ziel einmal an den oberen Rand,
         * wie bei Tallyroom; das Rollen löst die nächste Messung aus.
         */
        if (ziel && kasten && platz.verdeckt && !hochgerollt) {
          hochgerollt = true;
          rollstandMerken(ziel, rollstand);
          window.scrollBy({ top: kasten.top - OBEN, behavior: 'instant' });
        }
        setLage({ loch, karte: platz, gemessen: true });
      });
    };

    messen();
    void document.fonts.ready.then(messen);
    window.addEventListener('resize', messen);
    window.addEventListener('scroll', messen, true);
    const beobachter = new MutationObserver(messen);
    beobachter.observe(document.body, { childList: true, subtree: true });
    const groesse = new ResizeObserver(messen);
    if (karte.current) groesse.observe(karte.current);

    return () => {
      aktiv = false;
      cancelAnimationFrame(bild);
      window.removeEventListener('resize', messen);
      window.removeEventListener('scroll', messen, true);
      beobachter.disconnect();
      groesse.disconnect();
    };
  }, [ziele, karte, rollstand]);

  return lage;
}
