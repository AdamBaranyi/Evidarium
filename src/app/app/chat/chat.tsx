'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { AntwortKarte } from './antwort-karte';
import { QuellenPanel, type PanelInhalt } from './quellen-panel';
import { DokumentWahl } from './dokument-wahl';
import { Schrittanzeige } from './schrittanzeige';
import {
  belegteDokumente,
  KATEGORIEWERT,
  type Dokument,
  type Eintrag,
  type Schritt,
  type StromZeile,
} from './typen';

/*
 * Die Oberfläche hält bewusst wenig Zustand: Fragen und Antworten stehen
 * untereinander, der Zustand «läuft gerade» ist genau einer.
 *
 * Was hier **nicht** passiert: eine Antwort anzeigen, während sie entsteht.
 * Der Text erscheint erst, wenn die Belegprüfung ihn freigegeben hat.
 */

/** Wie viele frühere Wechsel als Gesprächskontext mitgehen. */
const VERLAUF_TIEFE = 6;

export type ChatEigenschaften = {
  dokumente: Dokument[];
  /** Endpunkt, der den NDJSON-Strom liefert. */
  endpunkt?: string;
  /**
   * Darf die fragende Person die Dokumente auswählen? In der öffentlichen
   * Demo nicht: Dort setzt der Server die Auswahl, und der Browser schickt
   * weder IDs noch Gesprächsverlauf.
   */
  auswaehlbar?: boolean;
  /** Zusätzlicher Hinweis für die Seitenspalte, etwa das Kontingent. */
  seitenhinweis?: React.ReactNode;
};

export function Chat({
  dokumente,
  endpunkt = '/api/chat',
  auswaehlbar = true,
  seitenhinweis,
}: ChatEigenschaften) {
  const [gewaehlt, setGewaehlt] = useState<string[]>(() => dokumente.map((d) => d.id));
  const [eintraege, setEintraege] = useState<Eintrag[]>([]);
  const [schritte, setSchritte] = useState<Schritt[]>([]);
  const [laeuft, setLaeuft] = useState(false);
  const [panel, setPanel] = useState<PanelInhalt | null>(null);
  const feld = useRef<HTMLTextAreaElement>(null);

  async function fragen(formular: FormData) {
    // `FormData.get` liefert auch `File` — ein Feldname, den jemand von
    // aussen anders belegt, soll hier nicht als «[object Object]» landen.
    const eingabe = formular.get('frage');
    const frage = typeof eingabe === 'string' ? eingabe.trim() : '';
    if (frage === '' || laeuft) return;
    if (auswaehlbar && gewaehlt.length === 0) return;

    const eigene: Eintrag = { id: crypto.randomUUID(), art: 'frage', text: frage };
    const bisher = [...eintraege, eigene];
    setEintraege(bisher);
    setSchritte([]);
    setLaeuft(true);
    if (feld.current) feld.current.value = '';

    try {
      const antwort = await fetch(endpunkt, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          auswaehlbar
            ? { frage, documentIds: gewaehlt, verlauf: alsVerlauf(eintraege) }
            : { frage },
        ),
      });

      if (!antwort.ok || !antwort.body) {
        const daten = (await antwort.json().catch(() => null)) as { fehler?: string } | null;
        setEintraege([...bisher, hinweis('fehler', daten?.fehler ?? 'Anfrage nicht möglich.')]);
        return;
      }

      await stromLesen(antwort.body, (zeile) => {
        /*
         * Die Uhr wird **vor** dem Aufruf abgelesen, nicht im Updater.
         *
         * Ein Updater muss rein sein: React ruft ihn erneut auf, wenn eine
         * weitere Aktualisierung ansteht oder im Entwicklungsmodus doppelt
         * gerendert wird. Ein `Date.now()` darin liefert beim zweiten Lauf
         * eine neuere Zeit — gemessen am 17.09.2026 standen darum alle
         * Schritte bei 0.0 s, obwohl der Modellaufruf Sekunden brauchte.
         */
        const jetzt = Date.now();
        if (zeile.art === 'phase') {
          setSchritte((alt) => schrittAnfuegen(alt, zeile.phase, jetzt));
          return;
        }
        setSchritte((alt) => schrittAbschliessen(alt, jetzt));
        setEintraege([...bisher, alsEintrag(zeile)]);
      });
    } catch {
      setEintraege([...bisher, hinweis('fehler', 'Die Verbindung wurde unterbrochen.')]);
    } finally {
      setLaeuft(false);
    }
  }

  if (dokumente.length === 0) {
    return (
      <p className="max-w-[var(--mass)] panel p-4">
        Hier ist noch nichts zu durchsuchen.{' '}
        <Link href="/app/documents" className="underline underline-offset-4">
          Lade zuerst ein Dokument hoch
        </Link>
        .
      </p>
    );
  }

  /*
   * Worauf die letzte Antwort steht. Die Seitenspalte zeigt es als Punkt in
   * der Farbe des Urteils — sonst müsste man durch alle Belege hindurch
   * nachzählen, welche Dokumente überhaupt beigetragen haben.
   */
  const letzte = [...eintraege].reverse().find((e) => e.art === 'antwort');
  const belegt = letzte ? belegteDokumente(letzte.antwort) : undefined;
  const farbe = letzte ? KATEGORIEWERT[letzte.antwort.kategorie] : undefined;

  return (
    <div className="flex flex-col gap-4">
      {/*
       * Ein Fenster, wie auf der Startseite: Seitenspalte links, Arbeit
       * rechts. Dasselbe Material, damit der Übergang vom Schaufenster in
       * die Anwendung keiner ist.
       */}
      <div className="panel overflow-hidden">
        <div className="panel-leiste">
          <span className="font-blatt text-tinte">Evidarium</span>
          <span>
            {letzte
              ? `${letzte.antwort.stellen.length === 1 ? '1 Quelle' : `${letzte.antwort.stellen.length} Quellen`} geprüft`
              : `${dokumente.length === 1 ? '1 Dokument' : `${dokumente.length} Dokumente`} bereit`}
          </span>
        </div>

        <div className="grid lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="flex min-w-0 flex-col gap-4 border-b border-kante bg-flaeche p-4 lg:border-r lg:border-b-0">
            <DokumentWahl
              dokumente={dokumente}
              gewaehlt={gewaehlt}
              setzen={setGewaehlt}
              auswaehlbar={auswaehlbar}
              belegt={belegt}
              farbe={farbe}
            />
            {seitenhinweis}
          </aside>

          <div className="flex min-w-0 flex-col gap-8 p-5">
            <ol className="flex flex-col gap-10">
              {eintraege.map((eintrag) => (
                <li key={eintrag.id}>
                  {eintrag.art === 'frage' && (
                    /* Die Frage steht als Frage da, ohne Sprechblase — es ist
                       ein Arbeitsplatz, kein Chat. */
                    <p className="max-w-[var(--mass)] text-xl leading-tight">{eintrag.text}</p>
                  )}
                  {eintrag.art === 'antwort' && (
                    <AntwortKarte antwort={eintrag.antwort} oeffnen={setPanel} />
                  )}
                  {eintrag.art === 'hinweis' && (
                    <p
                      role={eintrag.ton === 'fehler' ? 'alert' : undefined}
                      className="max-w-[var(--mass)] border border-kante bg-flaeche-tief p-4"
                    >
                      {eintrag.nachricht}
                    </p>
                  )}
                </li>
              ))}
            </ol>

            <Schrittanzeige schritte={schritte} laeuft={laeuft} />

            <form action={fragen} className="flex max-w-[var(--mass-blatt)] flex-col gap-3">
              <label className="flex min-w-0 flex-col gap-2">
                <span>{auswaehlbar ? 'Frage an die ausgewählten Dokumente' : 'Deine Frage'}</span>
                <textarea
                  ref={feld}
                  name="frage"
                  rows={3}
                  required
                  maxLength={2000}
                  /*
                   * `w-full`, sonst bestimmt die Voreinstellung `cols` die
                   * Breite: Das Feld schrumpft dann nicht unter rund 350 px
                   * und schiebt bei 320 px die ganze Seite in die Breite.
                   */
                  className="w-full border border-kante bg-flaeche-tief p-3 text-base"
                />
              </label>

              <button
                type="submit"
                disabled={laeuft || (auswaehlbar && gewaehlt.length === 0)}
                className="min-h-11 self-start bg-aktion-grund px-5 py-2 text-aktion-tinte transition-opacity duration-[var(--dauer-kurz)] disabled:opacity-55"
              >
                {laeuft ? 'Wird beantwortet …' : 'Frage stellen'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <QuellenPanel inhalt={panel} schliessen={() => setPanel(null)} />
    </div>
  );
}

/**
 * Liest den NDJSON-Strom zeilenweise.
 *
 * Ein Netzwerkpaket endet nicht zwingend am Zeilenende — der Rest muss
 * stehen bleiben, bis er vollständig ist. Ohne diesen Puffer geht genau die
 * Zeile verloren, die unglücklich geteilt wurde.
 */
async function stromLesen(
  körper: ReadableStream<Uint8Array>,
  je: (zeile: StromZeile) => void,
): Promise<void> {
  const leser = körper.getReader();
  const dekodierer = new TextDecoder();
  let rest = '';

  for (;;) {
    const { done, value } = await leser.read();
    if (done) break;
    rest += dekodierer.decode(value, { stream: true });

    const zeilen = rest.split('\n');
    rest = zeilen.pop() ?? '';
    for (const zeile of zeilen) {
      if (zeile.trim() === '') continue;
      je(JSON.parse(zeile) as StromZeile);
    }
  }

  /*
   * Was ohne abschliessenden Zeilenumbruch endet, wäre sonst verloren. Das
   * ist kein Randfall: Eine Antwort, die als schlichtes JSON kommt — etwa
   * eine erreichte Budgetgrenze — hat gar keinen Umbruch.
   */
  if (rest.trim() !== '') je(JSON.parse(rest) as StromZeile);
}

function schrittAnfuegen(alt: Schritt[], phase: Schritt['phase'], jetzt: number): Schritt[] {
  return [...schrittAbschliessen(alt, jetzt), { phase, dauerMs: null, seit: jetzt }];
}

/** Der laufende Schritt bekommt seine gemessene Dauer. */
function schrittAbschliessen(alt: Schritt[], jetzt: number): Schritt[] {
  return alt.map((schritt) =>
    schritt.dauerMs === null ? { ...schritt, dauerMs: jetzt - schritt.seit } : schritt,
  );
}

function hinweis(ton: 'budget' | 'fehler' | 'leer', nachricht: string): Eintrag {
  return { id: crypto.randomUUID(), art: 'hinweis', ton, nachricht };
}

function alsEintrag(zeile: Exclude<StromZeile, { art: 'phase' }>): Eintrag {
  if (zeile.art === 'antwort') return { id: crypto.randomUUID(), art: 'antwort', antwort: zeile };
  if (zeile.art === 'budget') return hinweis('budget', zeile.nachricht);
  if (zeile.art === 'keine_treffer') {
    return hinweis(
      'leer',
      'In den ausgewählten Dokumenten steht dazu nichts. Das ist eine Antwort, kein Fehler.',
    );
  }
  return hinweis('fehler', zeile.nachricht);
}

/** Die letzten Wechsel als Gesprächskontext, gekürzt. */
function alsVerlauf(eintraege: Eintrag[]): { rolle: 'nutzer' | 'assistent'; text: string }[] {
  return eintraege
    .slice(-VERLAUF_TIEFE)
    .map((eintrag) => {
      if (eintrag.art === 'frage') return { rolle: 'nutzer' as const, text: eintrag.text };
      if (eintrag.art === 'antwort') {
        return {
          rolle: 'assistent' as const,
          text: eintrag.antwort.aussagen.map((a) => a.text).join(' '),
        };
      }
      return null;
    })
    .filter((wechsel) => wechsel !== null);
}
