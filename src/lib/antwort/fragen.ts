import { belegePruefen, type Abschnitt, type GeprüfteAussage } from './belegpruefung';
import { DemoProvider } from './demo-provider';
import { providerWaehlen } from './anthropic-provider';
import { ProviderFehler, type AntwortProvider } from './provider';
import type { Kategorie } from './schema';
import { frageEinbetten } from '@/lib/embeddings/client';
import { suchen, type Treffer } from '@/lib/search/suchen';

/*
 * Der vollständige Weg von der Frage zur geprüften Antwort.
 *
 * Reihenfolge und Zuständigkeit stehen hier an einer Stelle, damit niemand
 * später versehentlich einen Schritt überspringt — vor allem nicht die
 * Belegprüfung.
 */

/** Wie viele Fundstellen dem Modell übergeben werden. */
const KONTEXT_STELLEN = 8;

export type FrageErgebnis =
  | {
      art: 'antwort';
      kategorie: Kategorie;
      aussagen: GeprüfteAussage[];
      demo: boolean;
      verbrauch: { modell: string; eingabeTokens: number; ausgabeTokens: number } | null;
    }
  | { art: 'keine_treffer' }
  | { art: 'fehler'; code: string; nachricht: string };

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

export async function frageBeantworten(
  userId: string,
  documentIds: string[],
  frage: string,
  verlauf: { rolle: 'nutzer' | 'assistent'; text: string }[] = [],
): Promise<FrageErgebnis> {
  // 1. Frage einbetten — das Modell dafür lebt im Worker, nicht hier.
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
  const treffer = await suchen(userId, documentIds, frage, vektor);
  if (treffer.length === 0) return { art: 'keine_treffer' };

  const abschnitte = treffer.slice(0, KONTEXT_STELLEN).map(alsAbschnitt);

  // 3. Modell fragen. Kein stiller Rückfall: Welcher Adapter läuft, entscheidet
  //    allein die Konfiguration.
  const provider: AntwortProvider = providerWaehlen() ?? new DemoProvider();

  let ergebnis;
  try {
    ergebnis = await provider.antworten({ frage, abschnitte, verlauf });
  } catch (fehler) {
    if (fehler instanceof ProviderFehler) {
      return { art: 'fehler', code: fehler.code, nachricht: meldung(fehler.code) };
    }
    return { art: 'fehler', code: 'unerwartet', nachricht: meldung('unerwartet') };
  }

  // 4. **Belegprüfung.** Was hier durchfällt, wird nicht angezeigt.
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
    demo: provider.istDemo,
    verbrauch: ergebnis.verbrauch,
  };
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
