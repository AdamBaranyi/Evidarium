import { describe, expect, it } from 'vitest';
import { belegePruefen, type Abschnitt } from '@/lib/antwort/belegpruefung';
import { DemoProvider } from '@/lib/antwort/demo-provider';

/*
 * Der Demo-Adapter muss dieselbe Belegprüfung bestehen wie eine echte
 * Antwort. Sonst bliebe genau der Pfad ungetestet, auf den es ankommt — und
 * die CI liefe grün, ohne die Prüfung je ausgeführt zu haben.
 */

const ABSCHNITTE: Abschnitt[] = [
  {
    sourceId: 'a1',
    text: 'Teamhandbuch.pdf\n\nBeim Onboarding hilft Mara Keller. Zugänge werden vorbereitet.',
    documentId: 'dok-1',
    filename: 'Teamhandbuch.pdf',
    page: 2,
    lineStart: null,
    lineEnd: null,
  },
];

const provider = new DemoProvider();

describe('Demo-Adapter', () => {
  it('ist als Demo gekennzeichnet', () => {
    expect(provider.istDemo).toBe(true);
  });

  it('erzeugt eine Antwort, die die Belegprüfung besteht', async () => {
    const { antwort } = await provider.antworten({
      frage: 'Wer hilft beim Onboarding?',
      abschnitte: ABSCHNITTE,
      verlauf: [],
    });

    const geprueft = belegePruefen(antwort, ABSCHNITTE);
    expect(geprueft.gueltig, 'Demo-Antwort muss die Prüfung bestehen').toBe(true);
  });

  it('zitiert wörtlich aus dem Abschnitt', async () => {
    const { antwort } = await provider.antworten({
      frage: 'egal',
      abschnitte: ABSCHNITTE,
      verlauf: [],
    });

    const zitat = antwort.aussagen[0]?.belege[0]?.zitat ?? '';
    expect(zitat.length).toBeGreaterThan(0);
    expect(ABSCHNITTE[0]?.text.replace(/\s+/g, ' ')).toContain(zitat);
  });

  it('meldet ehrlich, wenn es keine Fundstelle gibt', async () => {
    const { antwort } = await provider.antworten({
      frage: 'Wie hoch ist das Budget?',
      abschnitte: [],
      verlauf: [],
    });

    expect(antwort.kategorie).toBe('keine_grundlage');
    expect(antwort.aussagen[0]?.belege).toEqual([]);
    // Auch das muss durch die Prüfung gehen: Eine Wissenslücke ist eine
    // gültige Antwort.
    expect(belegePruefen(antwort, []).gueltig).toBe(true);
  });

  it('kostet nichts und meldet das auch so', async () => {
    const { verbrauch } = await provider.antworten({
      frage: 'egal',
      abschnitte: ABSCHNITTE,
      verlauf: [],
    });

    expect(verbrauch).toBeNull();
  });
});
