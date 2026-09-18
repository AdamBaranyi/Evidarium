'use client';

import { useEffect, useRef, useState } from 'react';
import { useWenigerBewegung } from '@/lib/ui/bewegung';

/*
 * Die Vorführung auf der Startseite: ein Fenster, in dem eine Frage
 * tatsächlich durchläuft — einbetten, suchen, antworten, Belege prüfen —,
 * bis die Antwort mit ihrem Blatt dasteht.
 *
 * **Warum das hier laufen darf, obwohl sonst nichts von allein läuft:** Es ist
 * erklärende Bewegung auf einer Startseite, der einzige Ort, an dem der
 * `animate`-Skill das vorsieht. Sie zeigt den Ablauf, den man sonst
 * beschreiben müsste, und sie zeigt ihn mit den Zeiten, die er wirklich
 * braucht — der Modellaufruf dauert Sekunden, und das steht so da.
 *
 * Drei Regeln, die die Vorführung einhält:
 * - Sie läuft **nicht**, wenn sie niemand sieht (IntersectionObserver).
 * - Sie läuft **nicht** bei `prefers-reduced-motion`; dann steht sofort das
 *   Endbild da, vollständig und lesbar.
 * - Sie behauptet nichts: Die Sätze stammen aus dem Korpus, gegen den die
 *   Evaluation läuft.
 */

type Schritt = { text: string; dauer: string };

const SCHRITTE: Schritt[] = [
  { text: 'Frage wird eingebettet', dauer: '0.0 s' },
  { text: 'Dokumente werden durchsucht', dauer: '0.0 s' },
  { text: 'Modell formuliert die Antwort', dauer: '2.4 s' },
  { text: 'Belege werden geprüft', dauer: '0.0 s' },
];

const FRAGE = 'Wer hilft beim Onboarding?';
const AUSSAGE = 'Beim Onboarding hilft Mara Keller.';
const VOR = 'Die ersten beiden Wochen sind als Einarbeitung geplant. ';
const ZITAT = 'Beim Onboarding hilft Mara Keller.';
const NACH = ' Zugaenge werden vor dem ersten Arbeitstag vorbereitet.';

/** Die Marken der Vorführung in Millisekunden, vom Start der Schleife an. */
const TAKT = {
  frage: 300,
  schritt: [900, 1300, 1700, 4300] as const,
  fertig: [1300, 1700, 4300, 4700] as const,
  aussage: 5000,
  blatt: 5250,
  markierung: 5900,
  /*
   * Das fertige Bild steht lange: Es ist das, was man sieht, wenn man auf die
   * Seite kommt, und das, was auf einem Bildschirmfoto landet. Erst danach
   * blendet der Durchlauf aus und beginnt von vorn — ohne das Ausblenden
   * stünde das Fenster einen Moment leer da, und das sähe kaputt aus.
   */
  verblassen: 13600,
  ende: 14200,
};

export function Vorfuehrung() {
  const [zeit, setZeit] = useState(0);
  const [sichtbar, setSichtbar] = useState(false);
  const bereich = useRef<HTMLDivElement>(null);

  // Ohne Bewegungswunsch steht sofort das Endbild da.
  const ruhig = useWenigerBewegung();

  useEffect(() => {
    const element = bereich.current;
    if (!element) return;
    const beobachter = new IntersectionObserver(([eintrag]) =>
      setSichtbar(eintrag?.isIntersecting ?? false),
    );
    beobachter.observe(element);
    return () => beobachter.disconnect();
  }, []);

  useEffect(() => {
    if (ruhig || !sichtbar) return;
    // Ein Takt von 100 ms genügt: Die Marken liegen weit auseinander, und
    // ein feinerer Takt kostet nur Arbeit, die niemand sieht.
    const uhr = setInterval(() => setZeit((t) => (t > TAKT.ende ? 0 : t + 100)), 100);
    return () => clearInterval(uhr);
  }, [ruhig, sichtbar]);

  const t = ruhig ? TAKT.markierung : zeit;
  const da = (marke: number) => t >= marke;
  const geht = !ruhig && t >= TAKT.verblassen;

  return (
    <div ref={bereich} className={`vorfuehrung ${geht ? 'geht' : ''}`}>
      <div className="vorfuehrung-fenster">
        <div className="vorfuehrung-leiste">
          <span className="font-blatt">Evidarium</span>
          <span className="text-tinte-leise">Teamhandbuch.pdf</span>
        </div>

        <div className="vorfuehrung-inhalt">
          <p className={`vorfuehrung-frage ${da(TAKT.frage) ? 'ist-da' : ''}`}>{FRAGE}</p>

          <ol className="vorfuehrung-schritte">
            {SCHRITTE.map((schritt, i) => {
              const beginn = TAKT.schritt[i] ?? 0;
              const fertig = TAKT.fertig[i] ?? 0;
              return (
                <li key={schritt.text} className={da(beginn) ? 'ist-da' : ''}>
                  <span className={da(fertig) ? 'text-tinte-leise' : ''}>{schritt.text}</span>
                  <span className="text-tinte-leise">{da(fertig) ? schritt.dauer : '…'}</span>
                </li>
              );
            })}
          </ol>

          <p className={`vorfuehrung-aussage ${da(TAKT.aussage) ? 'ist-da' : ''}`}>{AUSSAGE}</p>
        </div>
      </div>

      {/* Das Blatt legt sich über das Fenster — so wie der Beleg über die Antwort. */}
      <div className={`vorfuehrung-blatt blatt ${da(TAKT.blatt) ? 'ist-da' : ''}`}>
        <span className="flex items-baseline justify-between gap-4 border-b border-blatt-kante pb-2">
          <span className="text-blatt-leise">Teamhandbuch.pdf</span>
          <span className="folio shrink-0">2</span>
        </span>
        <p className="mt-3 text-blatt-leise">
          {VOR}
          <mark className={da(TAKT.markierung) ? 'ist-da' : ''}>{ZITAT}</mark>
          {NACH}
        </p>
      </div>
    </div>
  );
}
