'use client';

import { useTexte } from '@/lib/i18n/client';
import { AntwortKarte } from './antwort-karte';
import type { PanelInhalt } from './quellen-panel';
import { SchrittZusammenfassung } from './schrittanzeige';
import { CHAT } from './texte';
import { KATEGORIEWERT, type Eintrag } from './typen';

/*
 * Der Verlauf: Fragen rechts als Blase, Antworten links ohne.
 *
 * Jede Zeile trägt ihre Art als Datenattribut, damit der Chat die letzte
 * Frage finden und in den Blick rollen kann, ohne je Eintrag eine Referenz
 * zu halten.
 */
export function Verlauf({
  eintraege,
  oeffnen,
}: {
  eintraege: Eintrag[];
  oeffnen: (inhalt: PanelInhalt) => void;
}) {
  return (
    <ol className="flex flex-col gap-10">
      {eintraege.map((eintrag) => (
        <li key={eintrag.id} data-art={eintrag.art} className="scroll-mt-6">
          {eintrag.art === 'frage' && <p className="frage-blase">{eintrag.text}</p>}
          {eintrag.art === 'antwort' && (
            <AntwortKarte antwort={eintrag.antwort} lauf={eintrag.lauf} oeffnen={oeffnen} />
          )}
          {eintrag.art === 'hinweis' && <Hinweis eintrag={eintrag} />}
        </li>
      ))}
    </ol>
  );
}

/**
 * Nichts gefunden ist ein Ergebnis und steht darum wie eine Antwort da, mit
 * dem Punkt für «keine Grundlage». Grenze und Fehler dagegen sind Hinweise
 * der Anwendung, keine Antworten.
 */
function Hinweis({ eintrag }: { eintrag: Extract<Eintrag, { art: 'hinweis' }> }) {
  const t = useTexte(CHAT).antwort;
  if (eintrag.ton === 'leer') {
    return (
      <article className="flex flex-col gap-3">
        <h3 className="urteil-marke text-lg leading-tight">
          <span
            aria-hidden
            className="urteil-punkt"
            style={{ background: KATEGORIEWERT.keine_grundlage }}
          />
          {t.nichtsGefunden}
        </h3>
        <p className="max-w-[var(--mass)] text-tinte-leise">{eintrag.nachricht}</p>
        {eintrag.lauf && (
          <div className="antwort-fuss">
            <SchrittZusammenfassung lauf={eintrag.lauf} />
          </div>
        )}
      </article>
    );
  }

  return (
    <p
      role={eintrag.ton === 'fehler' ? 'alert' : undefined}
      className="max-w-[var(--mass)] rounded-[10px] border border-kante bg-flaeche-tief p-4"
    >
      {eintrag.nachricht}
    </p>
  );
}
