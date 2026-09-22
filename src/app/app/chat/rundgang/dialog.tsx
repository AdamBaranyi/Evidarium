'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DEMO_GRENZEN } from '@/lib/demo/grenzen';
import { useSprache, useTexte } from '@/lib/i18n/client';
import { sprachTag } from '@/lib/i18n/sprachen';
import { URTEIL } from '../texte-urteil';
import type { Kasten } from './lage';
import type { Schritt } from './schritte';
import { RUNDGANG } from './texte';
import { useLage } from './use-lage';

const URTEILE = ['belegt', 'teilweise_belegt', 'keine_grundlage', 'widerspruch'] as const;

/*
 * Der Rundgang als echter modaler Dialog, wie das Quellen-Panel: Fokusfalle,
 * inerter Hintergrund und Escape kommen vom Browser. Die Karte steht neben
 * dem Element, um das es geht, und statt einer gleichmässigen Abdunkelung
 * bleibt dieses Element ausgespart.
 *
 * Ein Klick daneben beendet den Rundgang nicht — sonst wäre er mit einem
 * versehentlichen Tippen weg. Wer ihn beenden will, hat einen Knopf dafür.
 */
export function RundgangDialog({
  schritte,
  schritt,
  weiter,
  zurueck,
  schliessen,
  rollstand,
}: {
  schritte: Schritt[];
  schritt: number;
  weiter: () => void;
  zurueck: () => void;
  schliessen: () => void;
  rollstand: Map<Element, number>;
}) {
  const t = useTexte(RUNDGANG);
  const kurz = useTexte(URTEIL).urteilKurz;
  const sprache = useSprache();
  const dialog = useRef<HTMLDialogElement>(null);
  const karte = useRef<HTMLElement>(null);

  const aktuell = schritte[schritt] ?? schritte[0];
  const ziele = aktuell?.ziele ?? [];
  const lage = useLage(ziele, karte, rollstand);
  const letzter = schritt === schritte.length - 1;

  /*
   * Erst gleiten, wenn die Karte einmal stand. Sonst flöge sie beim Öffnen
   * aus der Ecke oben links herein, wo sie vor der ersten Messung liegt.
   */
  const [gleitet, setGleitet] = useState(false);
  useEffect(() => {
    if (!lage.gemessen || gleitet) return;
    const bild = requestAnimationFrame(() => setGleitet(true));
    return () => cancelAnimationFrame(bild);
  }, [lage.gemessen, gleitet]);

  // Layout-Effekt, damit der Fokus beim Schliessen dorthin zurückkehrt, wo er vorher war.
  useLayoutEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  // Nach jedem Schritt steht der Fokus auf «Weiter»: Mit Enter geht es durch den ganzen Rundgang.
  useEffect(() => {
    if (lage.gemessen)
      dialog.current?.querySelector<HTMLElement>('[data-rundgang-weiter]')?.focus();
  }, [schritt, lage.gemessen]);

  if (!aktuell) return null;

  const namen = new Intl.ListFormat(sprachTag(sprache), { type: 'disjunction' }).format(
    URTEILE.map((urteil) => t.zitieren(kurz[urteil])),
  );
  const text =
    aktuell.id === 'eigene'
      ? t.schritte.eigene.text(DEMO_GRENZEN.stunden)
      : aktuell.id === 'urteile'
        ? t.schritte.urteile.text(namen)
        : t.schritte[aktuell.id].text;

  return (
    <dialog
      ref={dialog}
      className="rundgang"
      aria-label={t.dialog}
      aria-describedby="rundgang-inhalt"
      data-gleitet={gleitet || undefined}
      onCancel={(e) => {
        e.preventDefault();
        schliessen();
      }}
    >
      <div aria-hidden className="rundgang-schleier" style={{ clipPath: schleier(lage.loch) }} />
      <div aria-hidden className="rundgang-rahmen" style={{ clipPath: rahmen(lage.loch) }} />

      <section
        ref={karte}
        className="rundgang-karte"
        data-gemessen={lage.gemessen || undefined}
        style={{ transform: `translate(${lage.karte.left}px, ${lage.karte.top}px)` }}
      >
        {/* Ein Schrittwechsel ändert nur den Inhalt; der Screenreader liest ihn so neu vor. */}
        <div id="rundgang-inhalt" aria-live="polite" className="flex flex-col gap-2">
          <p className="rundgang-fortschritt">{t.fortschritt(schritt + 1, schritte.length)}</p>
          <h2 className="text-lg leading-tight text-tinte">{t.schritte[aktuell.id].titel}</h2>
          <p>{text}</p>
        </div>

        <div className="rundgang-knoepfe">
          {schritt > 0 && (
            <button type="button" onClick={zurueck} className="rundgang-zurueck">
              {t.zurueck}
            </button>
          )}
          <button type="button" data-rundgang-weiter onClick={weiter} className="rundgang-weiter">
            {letzter ? t.fertig : t.weiter}
          </button>
        </div>

        {/*
         * Oben rechts, neben dem Fortschritt: So passen Zurück und Weiter bei
         * 320 Pixeln in eine Zeile, und die Karte verdeckt weniger. Im letzten
         * Schritt beendet «Loslegen»; ein zweiter Knopf dafür wäre doppelt.
         */}
        {!letzter && (
          <button type="button" onClick={schliessen} className="rundgang-beenden">
            {t.beenden}
          </button>
        )}
      </section>
    </dialog>
  );
}

/*
 * Der Schleier ist eine Fläche mit Loch: ein Vieleck, das erst das ganze
 * Bild umfährt und dann den Ausschnitt, gefüllt nach «evenodd». Gleich viele
 * Ecken in jedem Schritt — so kann der Browser zwischen zwei Ausschnitten
 * überblenden. Ohne Ziel schrumpft das Loch in der Mitte auf nichts.
 *
 * Der Rahmen ist dasselbe Vieleck, nur ist das äussere Rechteck bloss
 * anderthalb Pixel grösser als das Loch.
 */
function rechteck(kasten: Kasten | null, rand = 0): string {
  const [links, oben, rechts, unten] = kasten
    ? [
        kasten.left - rand,
        kasten.top - rand,
        kasten.left + kasten.width + rand,
        kasten.top + kasten.height + rand,
      ].map((wert) => `${wert}px`)
    : ['50%', '50%', '50%', '50%'];
  return `${links} ${oben}, ${rechts} ${oben}, ${rechts} ${unten}, ${links} ${unten}, ${links} ${oben}`;
}

function schleier(loch: Kasten | null): string {
  return `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${rechteck(loch)})`;
}

function rahmen(loch: Kasten | null): string {
  return `polygon(evenodd, ${rechteck(loch, 1.5)}, ${rechteck(loch)})`;
}
