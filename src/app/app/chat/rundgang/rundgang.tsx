'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTexte } from '@/lib/i18n/client';
import { EINGABE_ID } from '../eingabe';
import { RundgangDialog } from './dialog';
import { rollstandZurueck } from './lage';
import { rundgangSchluessel, schritteFuer, type Ort, type Schritt } from './schritte';
import { RUNDGANG } from './texte';

/*
 * Einmal von selbst, danach nur auf Wunsch — wie bei Tallyroom. Gemerkt
 * wird das im Browser, je Ort: Wer die Demo kennt, sieht beim ersten
 * Anmelden trotzdem, wo Hochladen und Projekte liegen.
 *
 * Ein nicht lesbarer Speicher (privates Fenster) darf nichts stoppen: Dann
 * kommt der Rundgang beim nächsten Laden wieder, mehr nicht.
 */
function gesehen(ort: Ort): boolean {
  try {
    return window.localStorage.getItem(rundgangSchluessel(ort)) === 'gesehen';
  } catch {
    return false;
  }
}

function merken(ort: Ort): void {
  try {
    window.localStorage.setItem(rundgangSchluessel(ort), 'gesehen');
  } catch {
    // Kein Speicher, kein Gedächtnis.
  }
}

const vorhanden = (ziel: string) => document.querySelector(`[data-rundgang="${ziel}"]`) !== null;

export function Rundgang({ ort }: { ort: Ort }) {
  const t = useTexte(RUNDGANG);
  const [schritte, setSchritte] = useState<Schritt[] | null>(null);
  const [schritt, setSchritt] = useState(0);
  // Ein Gegenstand für die ganze Lebenszeit; `useState` statt `useRef`, weil er beim Zeichnen gebraucht wird.
  const [rollstand] = useState(() => new Map<Element, number>());

  // Welche Schritte gelten, entscheidet sich beim Öffnen: Mitten im Gespräch sind es andere.
  const starten = useCallback(() => {
    setSchritt(0);
    setSchritte(schritteFuer(ort, vorhanden));
  }, [ort]);

  // Ein Bild später: Dann steht die Seite, und der erste Schritt misst richtig.
  useEffect(() => {
    const bild = requestAnimationFrame(() => {
      if (!gesehen(ort)) starten();
    });
    return () => cancelAnimationFrame(bild);
  }, [ort, starten]);

  function schliessen() {
    merken(ort);
    setSchritte(null);
    rollstandZurueck(rollstand);
  }

  // «Loslegen» heisst: jetzt fragen. Darum steht der Fokus danach im Eingabefeld.
  function loslegen() {
    schliessen();
    requestAnimationFrame(() => document.getElementById(EINGABE_ID)?.focus());
  }

  return (
    <>
      <button
        type="button"
        data-rundgang="rundgang"
        aria-haspopup="dialog"
        onClick={starten}
        className="min-h-11 underline underline-offset-4"
      >
        {t.knopf}
      </button>
      {schritte && (
        <RundgangDialog
          schritte={schritte}
          schritt={schritt}
          weiter={() => (schritt < schritte.length - 1 ? setSchritt(schritt + 1) : loslegen())}
          zurueck={() => setSchritt(Math.max(0, schritt - 1))}
          schliessen={schliessen}
          rollstand={rollstand}
        />
      )}
    </>
  );
}
