'use client';

import { useEffect, useRef, useState } from 'react';
import { useWenigerBewegung } from '@/lib/ui/bewegung';
import { SCHRITTE, SZENEN, TAKT } from './szenen';

/*
 * Die Vorführung auf der Startseite: ein Fenster, in dem Fragen tatsächlich
 * durchlaufen — einbetten, suchen, antworten, Belege prüfen —, bis die
 * Antwort mit ihren Blättern dasteht.
 *
 * Zwei Fälle im Wechsel, und der zweite ist der Punkt: Widersprechen sich
 * zwei Dokumente, zeigt Evidarium beide und löst nichts auf.
 *
 * **Warum das hier laufen darf, obwohl sonst nichts von allein läuft:** Es ist
 * erklärende Bewegung auf einer Startseite, der einzige Ort, an dem der
 * `animate`-Skill sie vorsieht. Sie läuft nicht, wenn sie niemand sieht, und
 * nicht bei `prefers-reduced-motion` — dann steht sofort das fertige Bild da.
 */
export function Vorfuehrung() {
  /*
   * **Eine** Uhr, und die Szene wird daraus berechnet.
   *
   * Die erste Fassung schaltete die Szene im Updater von `setZeit` weiter —
   * ein Zustandswechsel im Updater eines anderen Zustands. Updater müssen
   * rein sein; der Wechsel kam nie an. Derselbe Fehler wie am 17.09.2026 bei
   * den Schrittzeiten, nur an anderer Stelle.
   */
  const [uhr, setUhr] = useState(0);
  const [sichtbar, setSichtbar] = useState(false);
  const bereich = useRef<HTMLDivElement>(null);
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
    const takt = setInterval(() => setUhr((wert) => wert + 100), 100);
    return () => clearInterval(takt);
  }, [ruhig, sichtbar]);

  const runde = TAKT.ende + 100;
  const szene = Math.floor(uhr / runde) % SZENEN.length;
  const fall = SZENEN[szene] ?? SZENEN[0];
  if (!fall) return null;

  const t = ruhig ? TAKT.markierung : uhr % runde;
  const da = (marke: number) => t >= marke;
  const geht = !ruhig && t >= TAKT.verblassen;

  return (
    <div ref={bereich} className={`vorfuehrung ${geht ? 'geht' : ''}`}>
      <div aria-hidden className="archiv">
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="vorfuehrung-fenster">
        <div className="vorfuehrung-leiste">
          <span className="font-blatt">Evidarium</span>
          <span className="text-tinte-leise">
            {fall.blaetter.length === 1
              ? '1 Quelle geprüft'
              : `${fall.blaetter.length} Quellen geprüft`}
          </span>
        </div>

        <div className="vorfuehrung-inhalt">
          <p className={`vorfuehrung-frage ${da(TAKT.frage) ? 'ist-da' : ''}`}>{fall.frage}</p>

          <ol className="vorfuehrung-schritte">
            {SCHRITTE.map((schritt, i) => {
              const beginn = TAKT.schritt[i] ?? 0;
              const fertig = TAKT.fertig[i] ?? 0;
              const dauer = i === 2 ? fall.modellDauer : '0.0 s';
              return (
                <li key={schritt} className={da(beginn) ? 'ist-da' : ''}>
                  <span className={da(fertig) ? 'text-tinte-leise' : ''}>{schritt}</span>
                  <span className="text-tinte-leise">{da(fertig) ? dauer : '…'}</span>
                </li>
              );
            })}
          </ol>

          <div className={`vorfuehrung-urteil ${da(TAKT.urteil) ? 'ist-da' : ''}`}>
            <span aria-hidden className="vorfuehrung-balken" style={{ background: fall.farbe }} />
            <div>
              <p className="text-tinte-leise">{fall.urteil}</p>
              <p className="vorfuehrung-aussage-text">{fall.aussage}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Die Blätter legen sich über das Fenster — so wie der Beleg über die Antwort. */}
      <div className="vorfuehrung-blaetter">
        {fall.blaetter.map((blatt, i) => (
          <div
            key={blatt.datei}
            className={`vorfuehrung-blatt blatt ${da(TAKT.blatt + i * 250) ? 'ist-da' : ''}`}
          >
            <span className="flex items-baseline justify-between gap-4 border-b border-blatt-kante pb-2">
              <span className="text-blatt-leise">{blatt.datei}</span>
              <span className="folio shrink-0">{blatt.seite}</span>
            </span>
            <p className="mt-3 text-blatt-leise">
              {blatt.vor}
              <mark className={da(TAKT.markierung + i * 250) ? 'ist-da' : ''}>{blatt.zitat}</mark>
              {blatt.nach}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
