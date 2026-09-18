import { belegePruefen, type Abschnitt, type GeprüfteAussage } from './belegpruefung';
import { DemoProvider } from './demo-provider';
import { providerWaehlen } from './anthropic-provider';
import { ProviderFehler, type AntwortProvider } from './provider';
import type { Kategorie } from './schema';
import { frageEinbetten } from '@/lib/embeddings/client';
import { suchen, type Treffer } from '@/lib/search/suchen';
import { abrechnen, alsUnklarMarkieren, reservieren, type Reservierung } from '@/lib/budget/budget';
import { env } from '@/lib/config/env';

/*
 * Der vollständige Weg von der Frage zur geprüften Antwort.
 *
 * Reihenfolge und Zuständigkeit stehen hier an einer Stelle, damit niemand
 * später versehentlich einen Schritt überspringt — vor allem nicht die
 * Belegprüfung.
 */

/** Wie viele Fundstellen dem Modell übergeben werden. */
const KONTEXT_STELLEN = 8;

/*
 * Obergrenzen für die Reservierung **vor** dem Aufruf. Sie müssen das
 * Höchstmögliche abdecken, nicht das Wahrscheinliche — sonst reserviert man
 * zu wenig und der Deckel hält nicht.
 */
const MAX_EINGABE_TOKENS = 12_000;
const MAX_AUSGABE_TOKENS = 1_200;

/**
 * Die Arbeitsschritte, über die der Ablauf Auskunft gibt.
 *
 * **Jede Meldung steht für Arbeit, die gerade wirklich läuft.** Kein
 * Fortschrittsbalken, der von selbst weiterrückt, und keine erfundene
 * Tokenausgabe: Wer sieht, dass «Belege werden geprüft» vier Sekunden dauert,
 * soll daraus schliessen dürfen, dass die Prüfung vier Sekunden gedauert hat.
 */
export type Phase = 'einbetten' | 'suchen' | 'antworten' | 'pruefen';

/** Eine dem Modell übergebene Stelle, wie sie das Quellen-Panel anzeigt. */
export type Fundstelle = {
  sourceId: string;
  documentId: string;
  filename: string;
  page: number | null;
  lineStart: number | null;
  lineEnd: number | null;
  text: string;
};

export type FrageErgebnis =
  | { art: 'budget'; grund: string; nachricht: string }
  | {
      art: 'antwort';
      kategorie: Kategorie;
      aussagen: GeprüfteAussage[];
      /** Nur die tatsächlich zitierten Stellen — Grundlage des Quellen-Panels. */
      stellen: Fundstelle[];
      demo: boolean;
      verbrauch: { modell: string; eingabeTokens: number; ausgabeTokens: number } | null;
    }
  | { art: 'keine_treffer' }
  | { art: 'fehler'; code: string; nachricht: string };

export type FrageAuftrag = {
  userId: string;
  documentIds: string[];
  frage: string;
  /** Begrenzter Gesprächskontext: die letzten Wechsel, schon gekürzt. */
  verlauf?: { rolle: 'nutzer' | 'assistent'; text: string }[];
  /** Kennung für das Sitzungskontingent. Nie das Sitzungsgeheimnis selbst. */
  sessionId?: string | null;
  /** Hash der Herkunft, nur bei der öffentlichen Demo. Nie die IP. */
  originHash?: string | null;
  melden?: (phase: Phase) => void;
};

function alsAbschnitt(treffer: Treffer): Abschnitt {
  return {
    // Die Abschnitts-ID ist die Quellen-ID. Sie ist die einzige Kennung, die
    // das Modell zurückgeben darf.
    sourceId: treffer.chunkId,
    text: treffer.text,
    documentId: treffer.documentId,
    filename: treffer.filename,
    page: treffer.page,
    lineStart: treffer.lineStart,
    lineEnd: treffer.lineEnd,
  };
}

export async function frageBeantworten(auftrag: FrageAuftrag): Promise<FrageErgebnis> {
  const { userId, documentIds, frage } = auftrag;
  const verlauf = auftrag.verlauf ?? [];
  const sessionId = auftrag.sessionId ?? null;
  const melden = auftrag.melden ?? (() => {});

  // 1. Frage einbetten — das Modell dafür lebt im Worker, nicht hier.
  melden('einbetten');
  let vektor: number[];
  try {
    vektor = await frageEinbetten(frage);
  } catch (fehler) {
    return {
      art: 'fehler',
      code: 'einbetten',
      nachricht:
        fehler instanceof Error && fehler.message.includes('nicht erreichbar')
          ? 'Der Suchdienst läuft gerade nicht. Bitte später erneut versuchen.'
          : 'Die Frage konnte nicht verarbeitet werden.',
    };
  }

  // 2. Hybridsuche. Die Dokumentauswahl ist ein Wunsch, keine Berechtigung —
  //    die Abfragen filtern selbst auf den Nutzer.
  melden('suchen');
  const treffer = await suchen(userId, documentIds, frage, vektor);
  if (treffer.length === 0) return { art: 'keine_treffer' };

  const abschnitte = treffer.slice(0, KONTEXT_STELLEN).map(alsAbschnitt);

  // 3. Modell fragen. Kein stiller Rückfall: Welcher Adapter läuft, entscheidet
  //    allein die Konfiguration.
  const provider: AntwortProvider = providerWaehlen() ?? new DemoProvider();

  /*
   * Budget **vor** dem Aufruf reservieren, nicht danach prüfen. Der
   * Demo-Adapter kostet nichts und ist ausgenommen.
   */
  let reservierung: Reservierung | null = null;
  if (!provider.istDemo) {
    const ergebnisBudget = await reservieren({
      userId,
      sessionId,
      originHash: auftrag.originHash ?? null,
      modell: env.AI_CHAT_MODEL,
      maxEingabeTokens: MAX_EINGABE_TOKENS,
      maxAusgabeTokens: MAX_AUSGABE_TOKENS,
    });
    if ('grund' in ergebnisBudget) {
      return {
        art: 'budget',
        grund: ergebnisBudget.grund,
        nachricht: ergebnisBudget.nachricht,
      };
    }
    reservierung = ergebnisBudget;
  }

  melden('antworten');
  let ergebnis;
  try {
    ergebnis = await provider.antworten({ frage, abschnitte, verlauf });
  } catch (fehler) {
    // Die Reservierung bleibt stehen: Fehlende Messwerte sind keine
    // Nullkosten, und der Anbieter kann die Anfrage verarbeitet haben.
    if (reservierung) await alsUnklarMarkieren(reservierung);
    if (fehler instanceof ProviderFehler) {
      return { art: 'fehler', code: fehler.code, nachricht: meldung(fehler.code) };
    }
    return { art: 'fehler', code: 'unerwartet', nachricht: meldung('unerwartet') };
  }

  if (reservierung && ergebnis.verbrauch) {
    await abrechnen(
      reservierung,
      ergebnis.verbrauch.modell,
      ergebnis.verbrauch.eingabeTokens,
      ergebnis.verbrauch.ausgabeTokens,
    );
  } else if (reservierung) {
    await alsUnklarMarkieren(reservierung);
  }

  // 4. **Belegprüfung.** Was hier durchfällt, wird nicht angezeigt.
  melden('pruefen');
  const geprueft = belegePruefen(ergebnis.antwort, abschnitte);

  if (!geprueft.gueltig) {
    // Bewusst kein zweiter Versuch an dieser Stelle: Ein Reparaturlauf gehört
    // in den Aufrufer, der auch das Budget kennt. Hier wird nur gemeldet,
    // dass die Ausgabe die Prüfung nicht bestanden hat.
    console.warn('[antwort] Belegprüfung gescheitert', geprueft.befunde);
    return {
      art: 'fehler',
      code: 'belege_ungueltig',
      nachricht:
        'Die Antwort liess sich nicht mit den Quellen belegen und wird darum nicht angezeigt.',
    };
  }

  return {
    art: 'antwort',
    kategorie: geprueft.kategorie,
    aussagen: geprueft.aussagen,
    stellen: zitierteStellen(geprueft.aussagen, abschnitte),
    demo: provider.istDemo,
    verbrauch: ergebnis.verbrauch,
  };
}

/**
 * Nur die Abschnitte, auf die sich die Antwort wirklich beruft.
 *
 * Alle acht mitzuschicken wäre bequemer, gäbe aber Textstellen heraus, die in
 * der Antwort keine Rolle spielen — und liesse die Antwort breiter belegt
 * aussehen, als sie ist.
 */
function zitierteStellen(aussagen: GeprüfteAussage[], abschnitte: Abschnitt[]): Fundstelle[] {
  const gebraucht = new Set(aussagen.flatMap((a) => a.belege.map((b) => b.sourceId)));
  return abschnitte
    .filter((a) => gebraucht.has(a.sourceId))
    .map(({ sourceId, documentId, filename, page, lineStart, lineEnd, text }) => ({
      sourceId,
      documentId,
      filename,
      page,
      lineStart,
      lineEnd,
      text,
    }));
}

/**
 * Jeder Zustand bekommt einen eigenen Satz. Ein pauschales «Fehler» liesse
 * einen Anbieterausfall wie einen Produktfehler aussehen.
 */
function meldung(code: string): string {
  const texte: Record<string, string> = {
    zeitlimit: 'Die Antwort hat zu lange gedauert. Bitte noch einmal versuchen.',
    abgelehnt: 'Diese Frage wurde vom Modell abgelehnt.',
    ungueltige_ausgabe: 'Die Antwort kam in einem unerwarteten Format zurück.',
    nicht_erreichbar: 'Der Antwortdienst ist gerade nicht erreichbar.',
    unerwartet: 'Beim Beantworten ist ein unerwarteter Fehler aufgetreten.',
  };
  return texte[code] ?? texte.unerwartet ?? 'Unbekannter Fehler.';
}
