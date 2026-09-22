'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSprache, useTexte } from '@/lib/i18n/client';
import { useWenigerBewegung } from '@/lib/ui/bewegung';
import { DokumentWahl } from './dokument-wahl';
import { Eingabe, EINGABE_ID } from './eingabe';
import { LeererZustand, type Vorschlag } from './leerer-zustand';
import { QuellenPanel, type PanelInhalt } from './quellen-panel';
import { Schrittanzeige } from './schrittanzeige';
import { alsEintrag, alsVerlauf, ansageFuer, frageSenden, hinweis } from './strom';
import { CHAT } from './texte';
import { URTEIL } from './texte-urteil';
import {
  belegteDokumente,
  KATEGORIEWERT,
  type Dokument,
  type Eintrag,
  type Schritt,
} from './typen';
import { Verlauf } from './verlauf';
import { ZitatSprache } from './zitat-sprache';

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
  /** Was über den Dokumenten in der Seitenspalte steht, etwa die Projekte. */
  seitenkopf?: React.ReactNode | undefined;
  /** Der Name des Bereichs, auf den die Suche eingegrenzt ist — ein Projekt. */
  bereich?: string | undefined;
  /** Überschrift und Einleitung im leeren Chat. */
  titel: string;
  einleitung: string;
  vorschlaege?: Vorschlag[];
  modellAktiv: boolean;
  /** Dokumente, deren Text sicher deutsch ist — der Korpus der Demo. */
  deutscheDokumente?: string[];
};

export function Chat({
  dokumente,
  endpunkt = '/api/chat',
  auswaehlbar = true,
  seitenhinweis,
  seitenkopf,
  bereich,
  titel,
  einleitung,
  vorschlaege = [],
  modellAktiv,
  deutscheDokumente = [],
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
  const t = useTexte(CHAT);
  const urteil = useTexte(URTEIL);
  const oberflaeche = useSprache();
  const deutsch = new Set(deutscheDokumente);
  // Nur auszeichnen, wo die Sprache vom Rest der Seite abweicht.
  const zitatSprache = (id: string) => (oberflaeche !== 'de' && deutsch.has(id) ? 'de' : undefined);

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
            setEintraege([...bisher, alsEintrag(zeile, lauf, { chat: t, urteil })]);
            setAnsage(ansageFuer(zeile, { chat: t, urteil }));
          },
        },
        t.meldung.nichtMoeglich,
      );
      if (fehler !== null) setEintraege([...bisher, hinweis('fehler', fehler)]);
    } catch {
      setEintraege([...bisher, hinweis('fehler', t.meldung.unterbrochen)]);
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

  // Ganz ohne Dokumente und ohne Projekte gibt es nichts, wozwischen man wählen könnte.
  if (dokumente.length === 0 && !seitenkopf) {
    return (
      <p className="max-w-[var(--mass)] panel p-4">
        {t.nichtsDa}{' '}
        <Link href="/app/documents" className="underline underline-offset-4">
          {t.ersteHochladen}
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
    <ZitatSprache value={zitatSprache}>
      <div className="chat panel" data-urteil={letzte?.antwort.kategorie}>
        {/* Gleich hoch mit und ohne Knopf: Die Leiste springt nicht, wenn «Neu beginnen» kommt. */}
        <div className="panel-leiste min-h-[3.25rem] items-center py-1">
          <span className="font-blatt text-tinte">Evidarium</span>
          <span className="ms-auto">
            {letzte
              ? t.leiste.quellen(letzte.antwort.stellen.length)
              : t.leiste.bereit(dokumente.length)}
          </span>
          {eintraege.length > 0 && !laeuft && (
            <button
              type="button"
              onClick={neuBeginnen}
              className="min-h-11 underline underline-offset-4"
            >
              {t.leiste.neu}
            </button>
          )}
          <button
            type="button"
            aria-expanded={seiteOffen}
            aria-controls="chat-seite"
            onClick={() => setSeiteOffen(!seiteOffen)}
            className="min-h-11 underline underline-offset-4 lg:hidden"
          >
            {t.leiste.seitenspalte}
          </button>
        </div>

        <div className="chat-rumpf">
          <aside
            id="chat-seite"
            className={`chat-spalte ${seiteOffen ? 'flex' : 'hidden'} lg:flex`}
          >
            {seitenkopf}
            {dokumente.length > 0 && (
              <DokumentWahl
                dokumente={dokumente}
                gewaehlt={gewaehlt}
                setzen={setGewaehlt}
                auswaehlbar={auswaehlbar}
                belegt={belegt}
                farbe={farbe}
              />
            )}
            {seitenhinweis}
          </aside>

          {dokumente.length === 0 ? (
            /* Ein Projekt ohne fertige Dokumente: Die Seitenspalte bleibt, damit man weiterkommt. */
            <div className="chat-haupt">
              <div className="chat-verlauf">
                <div className="chat-spur ist-leer flex flex-col gap-3">
                  <h2 className="text-xl leading-[var(--line-title)]">{titel}</h2>
                  <p className="max-w-[var(--mass)] text-tinte-leise">
                    {t.leeresProjekt(bereich ?? t.diesemBereich)}{' '}
                    <Link href="/app/documents" className="text-tinte underline underline-offset-4">
                      {t.unterDokumente}
                    </Link>{' '}
                    {t.hochladenOderZuordnen}
                  </p>
                </div>
              </div>
            </div>
          ) : (
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
                    <h2 className="sr-only">{t.unterhaltung}</h2>
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
                    beschriftung={auswaehlbar ? t.eingabe.beschriftungWahl : t.eingabe.beschriftung}
                    platzhalter={t.eingabe.platzhalter}
                    umfang={gesperrt ? t.eingabe.keinDokument : t.eingabe.umfang(anzahl, bereich)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <QuellenPanel
          inhalt={panel}
          schliessen={() => setPanel(null)}
          mitDokumentLink={auswaehlbar}
        />
      </div>
    </ZitatSprache>
  );
}
