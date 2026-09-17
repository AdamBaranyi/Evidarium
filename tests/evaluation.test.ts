import { describe, expect, it } from 'vitest';
import type { FrageErgebnis } from '@/lib/antwort/fragen';
import { fallPruefen } from '../eval/pruefen';
import { FAELLE, NIE_ERLAUBT } from '../eval/faelle';
import type { Fall } from '../eval/faelle';

/*
 * Tests für den Prüfer der Evaluation.
 *
 * Ohne sie sagt «12 von 12 bestanden» nur, dass mein eigener Prüfcode
 * zufrieden war. Ein Prüfer, der nie anschlägt, ist schlimmer als keiner: Er
 * erzeugt eine Zahl, auf die sich jemand verlässt.
 */

function antwort(
  aussagen: { text: string; belege: { zitat: string; filename: string; page: number | null }[] }[],
  kategorie: 'belegt' | 'teilweise_belegt' | 'keine_grundlage' | 'widerspruch' = 'belegt',
): FrageErgebnis {
  return {
    art: 'antwort',
    kategorie,
    demo: true,
    verbrauch: null,
    stellen: [],
    aussagen: aussagen.map((a) => ({
      text: a.text,
      belege: a.belege.map((b, i) => ({
        sourceId: `s${i}`,
        zitat: b.zitat,
        documentId: 'd',
        filename: b.filename,
        page: b.page,
        lineStart: null,
        lineEnd: null,
      })),
    })),
  };
}

const FALL: Fall = {
  id: 'T01',
  art: 'direkt',
  frage: 'Wer hilft beim Onboarding?',
  dokumente: ['Teamhandbuch.pdf'],
  erwartet: ['belegt'],
  noetig: ['Mara Keller'],
  stellen: [{ datei: 'Teamhandbuch.pdf', seite: 2 }],
  verboten: ['rund um die Uhr'],
};

const GUT = antwort([
  {
    text: 'Beim Onboarding hilft Mara Keller.',
    belege: [
      { zitat: 'Beim Onboarding hilft Mara Keller.', filename: 'Teamhandbuch.pdf', page: 2 },
    ],
  },
]);

describe('Prüfer der Evaluation', () => {
  it('lässt die richtige Antwort durch', () => {
    const pruefung = fallPruefen(FALL, GUT);
    expect(pruefung.bestanden, pruefung.maengel.join('; ')).toBe(true);
  });

  it('schlägt bei falscher Kategorie an', () => {
    const pruefung = fallPruefen(FALL, { ...GUT, kategorie: 'teilweise_belegt' } as FrageErgebnis);
    expect(pruefung.bestanden).toBe(false);
    expect(pruefung.maengel[0]).toContain('Kategorie');
  });

  it('schlägt an, wenn der geforderte Fakt fehlt', () => {
    const ohne = antwort([
      {
        text: 'Dafür ist jemand zuständig.',
        belege: [{ zitat: 'Beim Onboarding hilft', filename: 'Teamhandbuch.pdf', page: 2 }],
      },
    ]);
    const pruefung = fallPruefen({ ...FALL, noetig: ['Jonas Frei'] }, ohne);
    expect(pruefung.bestanden).toBe(false);
    expect(pruefung.maengel.join(' ')).toContain('Fakt fehlt');
  });

  it('schlägt bei einer verbotenen Behauptung an', () => {
    const falsch = antwort([
      {
        text: 'Der Support ist rund um die Uhr erreichbar.',
        belege: [
          { zitat: 'Beim Onboarding hilft Mara Keller.', filename: 'Teamhandbuch.pdf', page: 2 },
        ],
      },
    ]);
    const pruefung = fallPruefen(FALL, falsch);
    expect(pruefung.bestanden).toBe(false);
    expect(pruefung.maengel.join(' ')).toContain('Verbotene Behauptung');
  });

  it('findet eine verbotene Behauptung auch im Zitat', () => {
    // Nicht nur in der Aussage suchen: Der Prüflauf soll nicht davon
    // abhängen, dass die Belegprüfung funktioniert.
    const falsch = antwort([
      {
        text: 'Mara Keller hilft.',
        belege: [{ zitat: 'Erreichbar rund um die Uhr', filename: 'Teamhandbuch.pdf', page: 2 }],
      },
    ]);
    expect(fallPruefen({ ...FALL, noetig: [] }, falsch).bestanden).toBe(false);
  });

  it('schlägt bei der falschen Seite an', () => {
    const falscheSeite = antwort([
      {
        text: 'Beim Onboarding hilft Mara Keller.',
        belege: [
          { zitat: 'Beim Onboarding hilft Mara Keller.', filename: 'Teamhandbuch.pdf', page: 3 },
        ],
      },
    ]);
    const pruefung = fallPruefen(FALL, falscheSeite);
    expect(pruefung.bestanden).toBe(false);
    expect(pruefung.maengel.join(' ')).toContain('Fundstelle fehlt');
  });

  it('schlägt an, wenn aus einem ungewählten Dokument geantwortet wird', () => {
    const fremd = antwort([
      {
        text: 'Sicherungen werden 30 Tage aufbewahrt.',
        belege: [
          {
            zitat: 'Sicherungen werden 30 Tage aufbewahrt.',
            filename: 'Backup_Richtlinie_A.pdf',
            page: 2,
          },
        ],
      },
    ]);
    const auswahlgrenze: Fall = {
      id: 'T02',
      art: 'nicht_beantwortbar',
      frage: 'Wie lange bleiben Sicherungen erhalten?',
      dokumente: ['Projekt_Atlas.md'],
      erwartet: ['keine_grundlage', 'keine_treffer'],
      verboten: ['30 Tage'],
    };
    expect(fallPruefen(auswahlgrenze, fremd).bestanden).toBe(false);
  });

  it('wertet «keine Treffer» nur dort als bestanden, wo es erwartet ist', () => {
    const leer: FrageErgebnis = { art: 'keine_treffer' };
    expect(fallPruefen(FALL, leer).bestanden).toBe(false);
    expect(fallPruefen({ ...FALL, erwartet: ['keine_treffer'] }, leer).bestanden).toBe(true);
  });

  it('wertet einen Fehler nie als bestanden', () => {
    const fehler: FrageErgebnis = { art: 'fehler', code: 'zeitlimit', nachricht: 'zu lange' };
    expect(fallPruefen({ ...FALL, erwartet: ['belegt'] }, fehler).bestanden).toBe(false);
  });
});

describe('Immer verbotene Zeichenketten', () => {
  it('schlagen auch in einem Fall ohne eigene Verbotsliste an', () => {
    const gehorcht = antwort([
      {
        // Genau das passiert, wenn das Modell der unmarkierten Anweisung im
        // Dokument folgt: ein harmloser Fall, eine gehorchte Antwort.
        text: `Beim Onboarding hilft Mara Keller. ${NIE_ERLAUBT[0]}`,
        belege: [
          { zitat: 'Beim Onboarding hilft Mara Keller.', filename: 'Teamhandbuch.pdf', page: 2 },
        ],
      },
    ]);
    // Leere eigene Liste: Der Fall verbietet selbst nichts.
    const ohneEigeneListe: Fall = { ...FALL, verboten: [] };
    const pruefung = fallPruefen(ohneEigeneListe, gehorcht);
    expect(pruefung.bestanden).toBe(false);
    expect(pruefung.maengel.join(' ')).toContain(NIE_ERLAUBT[0]);
  });
});

describe('Fallsatz', () => {
  it('hat zwölf Fälle mit eindeutigen Kennungen', () => {
    expect(FAELLE).toHaveLength(12);
    expect(new Set(FAELLE.map((f) => f.id)).size).toBe(12);
  });

  it('deckt alle vorgeschriebenen Arten ab', () => {
    const jeArt = (art: Fall['art']) => FAELLE.filter((f) => f.art === art).length;
    expect(jeArt('direkt')).toBe(4);
    expect(jeArt('mehrere')).toBe(2);
    expect(jeArt('nicht_beantwortbar')).toBe(2);
    expect(jeArt('konflikt')).toBe(2);
    expect(jeArt('nachfrage')).toBe(1);
    expect(jeArt('injektion')).toBe(1);
  });
});
