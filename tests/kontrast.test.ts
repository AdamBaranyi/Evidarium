import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * Kontraste aus den Tokens gerechnet — nicht aus dem Gedächtnis.
 *
 * Befund B5: Eingabefelder hoben sich mit 1,22:1 kaum ab, verlangt sind 3:1
 * (WCAG 1.4.11). Diese Prüfung liest `tokens.css` und rechnet nach, damit eine
 * spätere Farbänderung den Wert nicht still wieder unterschreitet.
 */

async function tokens(): Promise<{ dunkel: Map<string, string>; hell: Map<string, string> }> {
  const css = await readFile(
    join(import.meta.dirname, '..', 'src', 'styles', 'tokens.css'),
    'utf8',
  );
  const hellBeginn = css.indexOf('@media (prefers-color-scheme: light)');
  const lesen = (teil: string) =>
    new Map(
      [...teil.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1] ?? '', m[2] ?? '']),
    );
  return { dunkel: lesen(css.slice(0, hellBeginn)), hell: lesen(css.slice(hellBeginn)) };
}

function leuchtdichte(hex: string): number {
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * f(r ?? 0) + 0.7152 * f(g ?? 0) + 0.0722 * f(b ?? 0);
}

function kontrast(a: string, b: string): number {
  const [x, y] = [leuchtdichte(a), leuchtdichte(b)].sort((p, q) => q - p);
  return ((x ?? 0) + 0.05) / ((y ?? 0) + 0.05);
}

describe('Kontraste der Bedienelemente', () => {
  for (const schema of ['dunkel', 'hell'] as const) {
    it(`Rand der Eingabefelder hält 3:1 gegen alle Flächen, ${schema}`, async () => {
      const t = (await tokens())[schema];
      const rand = t.get('rand-bedienung') ?? '';
      for (const flaeche of ['flaeche', 'flaeche-hoch', 'flaeche-tief']) {
        expect(kontrast(rand, t.get(flaeche) ?? ''), `${flaeche}`).toBeGreaterThanOrEqual(3);
      }
    });

    it(`Fliesstext leise hält 4,5:1, ${schema}`, async () => {
      const t = (await tokens())[schema];
      // Blase: Einstiegsfrage unter dem Zeiger. Tief: Platzhalter und Umfang im Eingabefeld.
      for (const flaeche of ['flaeche', 'flaeche-hoch', 'flaeche-blase', 'flaeche-tief']) {
        expect(kontrast(t.get('tinte-leise') ?? '', t.get(flaeche) ?? '')).toBeGreaterThanOrEqual(
          4.5,
        );
      }
    });
  }

  for (const schema of ['dunkel', 'hell'] as const) {
    it(`der Fokusring ums Eingabefeld hält 3:1, ${schema}`, async () => {
      // E38: leise Tinte statt voller, weil das Feld fast immer den Fokus hat.
      const t = (await tokens())[schema];
      for (const flaeche of ['flaeche-hoch', 'flaeche-tief']) {
        expect(
          kontrast(t.get('tinte-leise') ?? '', t.get(flaeche) ?? ''),
          `${flaeche}`,
        ).toBeGreaterThanOrEqual(3);
      }
    });

    it(`die eigene Frage in der Blase hält 4,5:1, ${schema}`, async () => {
      const t = (await tokens())[schema];
      expect(kontrast(t.get('tinte') ?? '', t.get('flaeche-blase') ?? '')).toBeGreaterThanOrEqual(
        4.5,
      );
    });
  }

  it('die Kante des Blatts hebt sich hell von der Fläche ab', async () => {
    // Befund S4: Das Blatt ist ein Knopf; hell lag Papier auf Papier, 1,46:1.
    const t = (await tokens()).hell;
    expect(kontrast(t.get('blatt-kante') ?? '', t.get('flaeche') ?? '')).toBeGreaterThanOrEqual(3);
  });
});
