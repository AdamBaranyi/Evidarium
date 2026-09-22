import {
  herkunft,
  KATEGORIETEXT,
  type Antwort,
  type Eintrag,
  type Lauf,
  type Schritt,
  type StromZeile,
} from './typen';

/*
 * Was der Chat mit dem Strom des Endpunkts tut — ohne Oberfläche, damit die
 * Komponente nur noch darstellt.
 */

/** Wie viele frühere Wechsel als Gesprächskontext mitgehen. */
const VERLAUF_TIEFE = 6;

/** Eine fertige Zeile des Stroms, also alles ausser einer Phase. */
export type Ergebnis = Exclude<StromZeile, { art: 'phase' }>;

/**
 * Liest den NDJSON-Strom zeilenweise.
 *
 * Ein Netzwerkpaket endet nicht zwingend am Zeilenende — der Rest muss
 * stehen bleiben, bis er vollständig ist. Ohne diesen Puffer geht genau die
 * Zeile verloren, die unglücklich geteilt wurde.
 */
export async function stromLesen(
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

export type Rueckmeldung = {
  /** Ein Schritt hat begonnen; die Liste enthält alle bisherigen. */
  schritt: (schritte: Schritt[]) => void;
  /** Das Ergebnis ist da, mit dem ganzen Durchlauf. */
  ergebnis: (zeile: Ergebnis, lauf: Lauf) => void;
};

/**
 * Stellt eine Frage und meldet Schritte und Ergebnis zurück. Liefert eine
 * Fehlermeldung, wenn der Server gar nicht erst streamt, sonst `null`.
 *
 * Die Uhr läuft **hier**, nicht in der Komponente: Die Schritte werden in
 * einer lokalen Liste geführt und fertig übergeben. Ein Updater, der selbst
 * die Uhr abliest, ist unrein — React ruft ihn erneut auf, und ein
 * `Date.now()` darin lieferte beim zweiten Lauf eine neuere Zeit. Gemessen
 * am 17.09.2026 standen darum alle Schritte bei 0.0 s.
 *
 * Die Wartezeit zählt ab dem Absenden, nicht ab dem ersten Schritt: Davor
 * liegt schon der Weg zum Server, und gewartet wird auch dann.
 */
export async function frageSenden(
  endpunkt: string,
  koerper: unknown,
  melden: Rueckmeldung,
): Promise<string | null> {
  const gesendet = Date.now();
  let schritte: Schritt[] = [];

  const antwort = await fetch(endpunkt, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(koerper),
  });

  if (!antwort.ok || !antwort.body) {
    const daten = (await antwort.json().catch(() => null)) as { fehler?: string } | null;
    return daten?.fehler ?? 'Anfrage nicht möglich.';
  }

  await stromLesen(antwort.body, (zeile) => {
    const jetzt = Date.now();
    if (zeile.art === 'phase') {
      schritte = schrittAnfuegen(schritte, zeile.phase, jetzt);
      melden.schritt(schritte);
      return;
    }
    schritte = schrittAbschliessen(schritte, jetzt);
    melden.ergebnis(zeile, { schritte, wartezeitMs: jetzt - gesendet });
  });
  return null;
}

export function schrittAnfuegen(alt: Schritt[], phase: Schritt['phase'], jetzt: number): Schritt[] {
  return [...schrittAbschliessen(alt, jetzt), { phase, dauerMs: null, seit: jetzt }];
}

/** Der laufende Schritt bekommt seine gemessene Dauer. */
export function schrittAbschliessen(alt: Schritt[], jetzt: number): Schritt[] {
  return alt.map((schritt) =>
    schritt.dauerMs === null ? { ...schritt, dauerMs: jetzt - schritt.seit } : schritt,
  );
}

/** Ein Satz fürs Ohr: das Urteil und worauf es steht, nicht der ganze Text. */
export function ansageFuer(zeile: Ergebnis): string {
  if (zeile.art === 'antwort') {
    const quellen = zeile.stellen.length;
    return `Antwort da: ${KATEGORIETEXT[zeile.kategorie]}, ${quellen === 1 ? 'eine Quelle' : `${quellen} Quellen`}.`;
  }
  if (zeile.art === 'keine_treffer') return 'In den ausgewählten Dokumenten steht dazu nichts.';
  return zeile.nachricht;
}

export function hinweis(
  ton: 'budget' | 'fehler' | 'leer',
  nachricht: string,
  lauf?: Lauf,
): Eintrag {
  const id = crypto.randomUUID();
  return lauf
    ? { id, art: 'hinweis', ton, nachricht, lauf }
    : { id, art: 'hinweis', ton, nachricht };
}

export function alsEintrag(zeile: Ergebnis, lauf: Lauf): Eintrag {
  if (zeile.art === 'antwort') {
    return { id: crypto.randomUUID(), art: 'antwort', antwort: zeile, lauf };
  }
  if (zeile.art === 'budget') return hinweis('budget', zeile.nachricht);
  if (zeile.art === 'keine_treffer') {
    return hinweis(
      'leer',
      'In den ausgewählten Dokumenten steht dazu nichts. Das ist eine Antwort, kein Fehler.',
      lauf,
    );
  }
  return hinweis('fehler', zeile.nachricht);
}

/** Die letzten Wechsel als Gesprächskontext, gekürzt. */
export function alsVerlauf(
  eintraege: Eintrag[],
): { rolle: 'nutzer' | 'assistent'; text: string }[] {
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

/**
 * Die Antwort als Text zum Weitergeben — **mit** den Belegen.
 *
 * Wer eine Aussage aus Evidarium kopiert, soll ihre Quelle mitnehmen. Ohne
 * sie wäre die Kopie genau das, was das Produkt vermeiden will: eine
 * Behauptung ohne Nachweis.
 */
export function alsText(antwort: Antwort): string {
  const stellen = new Map(antwort.stellen.map((s) => [s.sourceId, s]));
  const zeilen = [KATEGORIETEXT[antwort.kategorie], ''];

  for (const aussage of antwort.aussagen) {
    zeilen.push(aussage.text);
    for (const beleg of aussage.belege) {
      const stelle = stellen.get(beleg.sourceId);
      if (!stelle) continue;
      const ort = herkunft(stelle);
      zeilen.push(`  «${beleg.zitat}» (${stelle.filename}${ort ? `, ${ort}` : ''})`);
    }
    zeilen.push('');
  }
  return zeilen.join('\n').trim();
}
