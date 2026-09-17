import { describe, expect, it } from 'vitest';
import { belegePruefen, normalisieren, type Abschnitt } from '@/lib/antwort/belegpruefung';
import type { Modellantwort } from '@/lib/antwort/schema';

/*
 * Diese Tests sind die Absicherung des Kernversprechens.
 *
 * Sie prüfen nicht, ob das Modell gute Antworten gibt — das gehört ins
 * Evaluationsset. Sie prüfen, dass eine **erfundene** Fundstelle nicht
 * durchkommt. Fällt einer dieser Tests, ist das Produkt kaputt, auch wenn
 * alles andere grün ist.
 */

const ABSCHNITTE: Abschnitt[] = [
  {
    sourceId: 'a1',
    text: 'Teamhandbuch.pdf\n\nBeim   Onboarding hilft\nMara Keller. Zugänge werden vorbereitet.',
    documentId: 'dok-1',
    filename: 'Teamhandbuch.pdf',
    page: 2,
    lineStart: null,
    lineEnd: null,
  },
  {
    sourceId: 'a2',
    text: 'Supportprozess.pdf\n\nDie interne Zielreaktion beträgt zwei Stunden.',
    documentId: 'dok-2',
    filename: 'Supportprozess.pdf',
    page: 2,
    lineStart: null,
    lineEnd: null,
  },
];

function antwort(teil: Partial<Modellantwort>): Modellantwort {
  return { kategorie: 'belegt', aussagen: [], ...teil };
}

describe('Normalisierung', () => {
  it('fasst beliebigen Whitespace zusammen', () => {
    expect(normalisieren('a  \n\t b')).toBe('a b');
  });

  it('vereinheitlicht typografische Anführungs- und Bindestriche', () => {
    expect(normalisieren('„Zwei“ – drei')).toBe('"Zwei" - drei');
  });

  it('bringt zerlegte Umlaute auf dieselbe Form', () => {
    // Dateien vom Mac liefern NFD; dasselbe Wort sähe sonst verschieden aus.
    expect(normalisieren('Zugänge')).toBe(normalisieren('Zugänge'));
  });

  it('lässt Grossschreibung und Satzzeichen unangetastet', () => {
    // Jede weitere Grosszügigkeit würde die Prüfung schwächen.
    expect(normalisieren('Mara Keller.')).not.toBe(normalisieren('mara keller'));
  });
});

describe('Belegprüfung', () => {
  it('lässt eine korrekt belegte Antwort durch', () => {
    const ergebnis = belegePruefen(
      antwort({
        aussagen: [
          {
            text: 'Beim Onboarding hilft Mara Keller.',
            belege: [{ sourceId: 'a1', zitat: 'Beim Onboarding hilft Mara Keller.' }],
          },
        ],
      }),
      ABSCHNITTE,
    );

    expect(ergebnis.gueltig).toBe(true);
    if (!ergebnis.gueltig) return;
    expect(ergebnis.aussagen[0]?.belege[0]?.page).toBe(2);
  });

  it('verwirft eine erfundene Quellen-ID', () => {
    const ergebnis = belegePruefen(
      antwort({
        aussagen: [
          {
            text: 'Irgendetwas.',
            belege: [{ sourceId: 'gibt-es-nicht', zitat: 'Beim Onboarding hilft Mara Keller.' }],
          },
        ],
      }),
      ABSCHNITTE,
    );

    expect(ergebnis.gueltig).toBe(false);
    if (ergebnis.gueltig) return;
    expect(ergebnis.befunde).toContainEqual({
      art: 'unbekannte_quelle',
      sourceId: 'gibt-es-nicht',
    });
  });

  it('verwirft ein Zitat, das im Abschnitt nicht vorkommt', () => {
    // Der gefährlichste Fall: echte Quelle, erfundener Inhalt. Die Antwort
    // sieht vollkommen glaubwürdig aus.
    const ergebnis = belegePruefen(
      antwort({
        aussagen: [
          {
            text: 'Beim Onboarding hilft Peter Muster.',
            belege: [{ sourceId: 'a1', zitat: 'Beim Onboarding hilft Peter Muster.' }],
          },
        ],
      }),
      ABSCHNITTE,
    );

    expect(ergebnis.gueltig).toBe(false);
    if (ergebnis.gueltig) return;
    expect(ergebnis.befunde[0]?.art).toBe('zitat_nicht_gefunden');
  });

  it('verwirft ein Zitat, das aus dem falschen Abschnitt stammt', () => {
    const ergebnis = belegePruefen(
      antwort({
        aussagen: [
          {
            text: 'Vermischt.',
            // Der Satz steht in a2, nicht in a1.
            belege: [{ sourceId: 'a1', zitat: 'Die interne Zielreaktion beträgt zwei Stunden.' }],
          },
        ],
      }),
      ABSCHNITTE,
    );

    expect(ergebnis.gueltig).toBe(false);
  });

  it('akzeptiert ein Zitat trotz anderer Zeilenumbrüche', () => {
    // Im Abschnitt stehen drei Leerzeichen und ein Umbruch mitten im Satz.
    const ergebnis = belegePruefen(
      antwort({
        aussagen: [
          {
            text: 'Onboarding.',
            belege: [{ sourceId: 'a1', zitat: 'Beim Onboarding hilft Mara Keller.' }],
          },
        ],
      }),
      ABSCHNITTE,
    );

    expect(ergebnis.gueltig).toBe(true);
  });

  it('verwirft «belegt» mit einer Aussage ohne Beleg', () => {
    const ergebnis = belegePruefen(
      antwort({
        kategorie: 'belegt',
        aussagen: [
          {
            text: 'Beim Onboarding hilft Mara Keller.',
            belege: [{ sourceId: 'a1', zitat: 'Beim Onboarding hilft Mara Keller.' }],
          },
          { text: 'Ausserdem gilt Folgendes.', belege: [] },
        ],
      }),
      ABSCHNITTE,
    );

    expect(ergebnis.gueltig).toBe(false);
    if (ergebnis.gueltig) return;
    expect(ergebnis.befunde).toContainEqual({
      art: 'aussage_ohne_beleg',
      text: 'Ausserdem gilt Folgendes.',
    });
  });

  it('lässt «keine Grundlage» ohne Belege zu', () => {
    // Die ehrliche Wissenslücke ist eine gültige Antwort, kein Fehler.
    const ergebnis = belegePruefen(
      antwort({
        kategorie: 'keine_grundlage',
        aussagen: [{ text: 'Dazu steht nichts in den gewählten Dokumenten.', belege: [] }],
      }),
      ABSCHNITTE,
    );

    expect(ergebnis.gueltig).toBe(true);
  });

  it('verwirft «belegt» ganz ohne Aussagen', () => {
    expect(belegePruefen(antwort({ kategorie: 'belegt', aussagen: [] }), ABSCHNITTE).gueltig).toBe(
      false,
    );
  });

  it('verwirft «Widerspruch», wenn kein Beleg gültig ist', () => {
    const ergebnis = belegePruefen(
      antwort({
        kategorie: 'widerspruch',
        aussagen: [{ text: 'A widerspricht B.', belege: [{ sourceId: 'x', zitat: 'irgendwas' }] }],
      }),
      ABSCHNITTE,
    );

    expect(ergebnis.gueltig).toBe(false);
  });

  it('nimmt Metadaten aus dem Abschnitt, nicht aus der Modellausgabe', () => {
    const ergebnis = belegePruefen(
      antwort({
        aussagen: [
          {
            text: 'Zielreaktion.',
            belege: [{ sourceId: 'a2', zitat: 'Die interne Zielreaktion beträgt zwei Stunden.' }],
          },
        ],
      }),
      ABSCHNITTE,
    );

    expect(ergebnis.gueltig).toBe(true);
    if (!ergebnis.gueltig) return;

    const beleg = ergebnis.aussagen[0]?.belege[0];
    expect(beleg?.filename).toBe('Supportprozess.pdf');
    expect(beleg?.documentId).toBe('dok-2');
    expect(beleg?.page).toBe(2);
  });
});
