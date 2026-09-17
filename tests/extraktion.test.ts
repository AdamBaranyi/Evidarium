import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { erkenneTyp } from '@/lib/documents/dateityp';
import { ExtraktionsFehler, extrahieren } from '@/lib/documents/extrahieren';
import { zerlegen } from '@/lib/documents/zerlegen';

async function fixture(name: string): Promise<Uint8Array> {
  return new Uint8Array(await readFile(`tests/fixtures/${name}`));
}

describe('Typerkennung am Inhalt', () => {
  it('erkennt ein PDF an seinen ersten Bytes', async () => {
    expect(erkenneTyp(await fixture('teamhandbuch.pdf'), 'teamhandbuch.pdf')).toBe('pdf');
  });

  it('erkennt ein PDF auch bei falscher Endung', async () => {
    // Der Dateiname lügt, der Inhalt nicht.
    expect(erkenneTyp(await fixture('teamhandbuch.pdf'), 'harmlos.txt')).toBe('pdf');
  });

  it('erkennt Text und unterscheidet Markdown am Namen', async () => {
    const bytes = await fixture('teamhandbuch.txt');
    expect(erkenneTyp(bytes, 'notiz.txt')).toBe('text');
    expect(erkenneTyp(bytes, 'notiz.md')).toBe('markdown');
  });

  it('lehnt Binärinhalt ab, auch mit harmloser Endung', () => {
    const binaer = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0x01, 0x02, 0x03]);
    expect(erkenneTyp(binaer, 'notiz.txt')).toBeNull();
  });
});

describe('PDF-Extraktion', () => {
  it('liefert Textstellen mit echten Seitenzahlen', async () => {
    const ergebnis = await extrahieren(await fixture('teamhandbuch.pdf'), 'pdf');

    expect(ergebnis.pageCount).toBe(3);
    expect(ergebnis.stellen.length).toBeGreaterThan(0);

    // Seitenzahlen sind 1-basiert, lückenlos und aufsteigend.
    const seiten = ergebnis.stellen.map((s) => s.page);
    expect(seiten.every((s) => s !== null)).toBe(true);
    expect(seiten).toEqual([...seiten].sort((a, b) => (a ?? 0) - (b ?? 0)));
    expect(Math.min(...seiten.map((s) => s ?? 0))).toBe(1);

    // Bei PDF gibt es keine Zeilenangaben — niemals erfundene Werte.
    expect(ergebnis.stellen.every((s) => s.lineStart === null && s.lineEnd === null)).toBe(true);
  });

  it('findet den versteckten Fakt auf der richtigen Seite', async () => {
    const ergebnis = await extrahieren(await fixture('teamhandbuch.pdf'), 'pdf');
    const treffer = ergebnis.stellen.find((s) => s.text.includes('Mara Keller'));

    expect(treffer, 'Mara Keller muss gefunden werden').toBeDefined();
    expect(treffer?.page).toBe(2);
  });

  it('lässt den Eingabepuffer unberührt', async () => {
    // pdf.js übernimmt den übergebenen Puffer und koppelt ihn ab. Ohne
    // Schutzkopie meldet der zweite Aufruf «beschädigt» für eine
    // einwandfreie Datei — eine Falschaussage über die Datei des Nutzers.
    const bytes = await fixture('teamhandbuch.pdf');
    const vorher = bytes.byteLength;

    await extrahieren(bytes, 'pdf');
    expect(bytes.byteLength, 'Puffer wurde entkoppelt').toBe(vorher);

    const zweiter = await extrahieren(bytes, 'pdf');
    expect(zweiter.pageCount).toBe(3);
  });

  it('meldet ein PDF ohne Textschicht mit eigenem Code', async () => {
    // Minimales gültiges PDF mit einer leeren Seite: kein Text zu holen.
    const leer = await fixture('ohne-textschicht.pdf');
    await expect(extrahieren(leer, 'pdf')).rejects.toThrow(ExtraktionsFehler);
    await expect(extrahieren(leer, 'pdf')).rejects.toMatchObject({
      code: 'pdf_ohne_textschicht',
    });
  });
});

describe('Text-Extraktion', () => {
  it('liefert Zeilenbereiche statt Seitenzahlen', async () => {
    const ergebnis = await extrahieren(await fixture('teamhandbuch.txt'), 'text');

    expect(ergebnis.pageCount).toBeNull();
    expect(ergebnis.stellen.every((s) => s.page === null)).toBe(true);
    expect(ergebnis.stellen.every((s) => s.lineStart !== null && s.lineEnd !== null)).toBe(true);

    // Der Bereich ist in sich stimmig und aufsteigend.
    for (const stelle of ergebnis.stellen) {
      expect(stelle.lineEnd ?? 0).toBeGreaterThanOrEqual(stelle.lineStart ?? 0);
    }
  });
});

describe('Zerlegung', () => {
  it('nimmt den Dateinamen in jeden Abschnitt auf', async () => {
    const ergebnis = await extrahieren(await fixture('teamhandbuch.pdf'), 'pdf');
    const abschnitte = zerlegen(ergebnis.stellen, 'Teamhandbuch.pdf');

    expect(abschnitte.length).toBeGreaterThan(0);
    // Ohne den Namen im Abschnitt findet die Suche ein Dokument später nicht
    // über seinen Titel.
    expect(abschnitte.every((a) => a.text.startsWith('Teamhandbuch.pdf'))).toBe(true);
  });

  it('nummeriert lückenlos und behält die Herkunft', async () => {
    const ergebnis = await extrahieren(await fixture('teamhandbuch.pdf'), 'pdf');
    const abschnitte = zerlegen(ergebnis.stellen, 'Teamhandbuch.pdf');

    expect(abschnitte.map((a) => a.ordinal)).toEqual(abschnitte.map((_, i) => i));
    expect(abschnitte.every((a) => a.page !== null)).toBe(true);
  });
});
