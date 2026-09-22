'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useWenigerBewegung } from '@/lib/ui/bewegung';
import { DokumentWahl } from './dokument-wahl';
import { Eingabe, EINGABE_ID } from './eingabe';
import { LeererZustand, type Vorschlag } from './leerer-zustand';
import { QuellenPanel, type PanelInhalt } from './quellen-panel';
import { Schrittanzeige } from './schrittanzeige';
import { alsEintrag, alsVerlauf, ansageFuer, frageSenden, hinweis } from './strom';
import {
  belegteDokumente,
  KATEGORIEWERT,
  type Dokument,
  type Eintrag,
  type Schritt,
} from './typen';
import { Verlauf } from './verlauf';

/*
 * Die Oberfläche hält bewusst wenig Zustand: Fragen und Antworten stehen
 * untereinander, der Zustand «läuft gerade» ist genau einer.
 *
 * Was hier **nicht** passiert: eine Antwort anzeigen, während sie entsteht.
 * Der Text erscheint erst, wenn die Belegprüfung ihn freigegeben hat.
 */

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
  /** Zusätzlicher Inhalt für die Seitenspalte, etwa eigene Dateien. */
  seitenhinweis?: React.ReactNode;
  /** Überschrift und Einleitung im leeren Chat. */
  titel: string;
  einleitung: string;
  vorschlaege?: Vorschlag[];
  modellAktiv: boolean;
};

export function Chat({
  dokumente,
  endpunkt = '/api/chat',
  auswaehlbar = true,
  seitenhinweis,
  titel,
  einleitung,
  vorschlaege = [],
  modellAktiv,
}: ChatEigenschaften) {
  const [gewaehlt, setGewaehlt] = useState<string[]>(() => dokumente.map((d) => d.id));
  const [eintraege, setEintraege] = useState<Eintrag[]>([]);
  const [schritte, setSchritte] = useState<Schritt[]>([]);
  const [laeuft, setLaeuft] = useState(false);
  const [panel, setPanel] = useState<PanelInhalt | null>(null);
  const [text, setText] = useState('');
  const [seiteOffen, setSeiteOffen] = useState(false);
  /*
   * Was Screenreadern angesagt wird, wenn das Ergebnis da ist. Die Schritte
   * wurden schon angesagt, die fertige Antwort bisher nicht — wer nicht
   * sieht, hörte «Belege werden geprüft» und danach nichts mehr. Befund S1.
   */
  const [ansage, setAnsage] = useState('');
  const verlauf = useRef<HTMLDivElement>(null);
  const ruhig = useWenigerBewegung();

  const gesperrt = auswaehlbar && gewaehlt.length === 0;

  /*
   * Die letzte Frage rollt nach oben in den Blick — einmal beim Senden und
   * noch einmal, wenn die Antwort da ist: Erst dann gibt es darunter genug
   * Inhalt, um die Frage ganz nach oben zu schieben, und die Antwort steht
   * direkt darunter statt hinter dem Eingabefeld.
   *
   * Am Schreibtisch rollt nur der Verlauf — `scrollIntoView` zöge die ganze
   * Seite mit, und die Kopfzeile verschwände. Schmal rollt die Seite selbst.
   */
  useEffect(() => {
    const kasten = verlauf.current;
    if (eintraege.length === 0 || !kasten) return;
    const alle = kasten.querySelectorAll<HTMLElement>('[data-art="frage"]');
    const frage = alle[alle.length - 1];
    if (!frage) return;
    const behavior = ruhig ? 'auto' : 'smooth';
    if (getComputedStyle(kasten).overflowY === 'auto') {
      kasten.scrollTo({ top: frage.offsetTop - 24, behavior });
    } else {
      frage.scrollIntoView({ block: 'start', behavior });
    }
  }, [eintraege.length, ruhig]);

  async function stellen(eingabe: string) {
    const frage = eingabe.trim();
    if (frage === '' || laeuft || gesperrt) return;

    const eigene: Eintrag = { id: crypto.randomUUID(), art: 'frage', text: frage };
    const bisher = [...eintraege, eigene];
    setEintraege(bisher);
    setSchritte([]);
    setLaeuft(true);
    setText('');
    fokusZurEingabe();

    try {
      const fehler = await frageSenden(
        endpunkt,
        auswaehlbar ? { frage, documentIds: gewaehlt, verlauf: alsVerlauf(eintraege) } : { frage },
        {
          schritt: setSchritte,
          ergebnis: (zeile, lauf) => {
            setSchritte([]);
            setEintraege([...bisher, alsEintrag(zeile, lauf)]);
            setAnsage(ansageFuer(zeile));
          },
        },
      );
      if (fehler !== null) setEintraege([...bisher, hinweis('fehler', fehler)]);
    } catch {
      setEintraege([...bisher, hinweis('fehler', 'Die Verbindung wurde unterbrochen.')]);
    } finally {
      setSchritte([]);
      setLaeuft(false);
    }
  }

  function neuBeginnen() {
    setEintraege([]);
    setSchritte([]);
    setAnsage('');
    fokusZurEingabe();
  }

  /*
   * Nach dem Senden, einem Vorschlag oder «Neu beginnen» steht der Fokus im
   * Eingabefeld. Sonst läge er auf einem Knopf, der gerade verschwunden ist
   * — und damit nirgends.
   */
  function fokusZurEingabe() {
    document.getElementById(EINGABE_ID)?.focus();
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
  const anzahl = auswaehlbar ? gewaehlt.length : dokumente.length;

  return (
    <div className="chat panel" data-urteil={letzte?.antwort.kategorie}>
      {/* Gleich hoch mit und ohne Knopf: Die Leiste springt nicht, wenn «Neu beginnen» kommt. */}
      <div className="panel-leiste min-h-[3.25rem] items-center py-1">
        <span className="font-blatt text-tinte">Evidarium</span>
        <span className="ms-auto">
          {letzte
            ? `${letzte.antwort.stellen.length === 1 ? '1 Quelle' : `${letzte.antwort.stellen.length} Quellen`} geprüft`
            : `${dokumente.length === 1 ? '1 Dokument' : `${dokumente.length} Dokumente`} bereit`}
        </span>
        {eintraege.length > 0 && !laeuft && (
          <button
            type="button"
            onClick={neuBeginnen}
            className="min-h-11 underline underline-offset-4"
          >
            Neu beginnen
          </button>
        )}
        <button
          type="button"
          aria-expanded={seiteOffen}
          aria-controls="chat-seite"
          onClick={() => setSeiteOffen(!seiteOffen)}
          className="min-h-11 underline underline-offset-4 lg:hidden"
        >
          Dokumente
        </button>
      </div>

      <div className="chat-rumpf">
        <aside id="chat-seite" className={`chat-spalte ${seiteOffen ? 'flex' : 'hidden'} lg:flex`}>
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

        <div className="chat-haupt">
          <div ref={verlauf} className="chat-verlauf">
            <div
              className={`chat-spur flex flex-col gap-10 ${eintraege.length === 0 ? 'ist-leer' : ''}`}
            >
              {eintraege.length === 0 ? (
                <LeererZustand
                  titel={titel}
                  einleitung={einleitung}
                  vorschlaege={vorschlaege}
                  fragen={(frage) => void stellen(frage)}
                  modellAktiv={modellAktiv}
                />
              ) : (
                /* Die Antworten tragen h3; ohne diese h2 fehlte eine Stufe. Befund S2. */
                <h2 className="sr-only">Unterhaltung</h2>
              )}
              <p role="status" className="sr-only">
                {ansage}
              </p>
              <Verlauf eintraege={eintraege} oeffnen={setPanel} />
              <Schrittanzeige schritte={schritte} laeuft={laeuft} />
            </div>
          </div>

          <div className="chat-unten">
            <div className="chat-spur">
              <Eingabe
                text={text}
                setText={setText}
                senden={() => void stellen(text)}
                laeuft={laeuft}
                gesperrt={gesperrt}
                beschriftung={auswaehlbar ? 'Frage an die ausgewählten Dokumente' : 'Deine Frage'}
                platzhalter="Frag etwas zu diesen Dokumenten"
                umfang={
                  gesperrt
                    ? 'Kein Dokument ausgewählt'
                    : `Sucht in ${anzahl === 1 ? 'einem Dokument' : `${anzahl} Dokumenten`}`
                }
              />
            </div>
          </div>
        </div>
      </div>

      <QuellenPanel inhalt={panel} schliessen={() => setPanel(null)} />
    </div>
  );
}
