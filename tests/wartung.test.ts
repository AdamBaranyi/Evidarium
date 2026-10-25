import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/*
 * Die monatliche Wartung hängt an zwei Dingen, die niemand meldet, wenn sie
 * auseinanderlaufen: an der Liste im Issue, die Adam Schritt für Schritt
 * abarbeitet, und an der Datenbank, gegen die die CI prüft.
 */
describe('monatliche Wartung', () => {
  it('die Erinnerung nennt nur Skripte, die es in infra/ gibt', () => {
    const erinnerung = readFileSync('.github/workflows/erinnerung-monatlich.yml', 'utf8');
    const skripte = [...erinnerung.matchAll(/\/opt\/evidarium\/infra\/([\w.-]+)/g)].map(
      ([, name]) => name ?? '',
    );

    expect(skripte.length).toBeGreaterThan(0);
    expect(skripte.filter((name) => !existsSync(`infra/${name}`))).toEqual([]);
  });

  /*
   * Dependabot hebt die Nummer in den Compose-Dateien, aber nicht im
   * Dienst-Container der CI. So lief die CI ab dem 10.10.2026 gegen pgvector
   * 0.8.6, die Produktion gegen 0.8.7.
   */
  it('die CI prüft gegen dasselbe Datenbank-Abbild wie Entwicklung und Produktion', () => {
    const abbilder = [
      '.github/workflows/ci.yml',
      'infra/compose.prod.yml',
      'infra/docker-compose.yml',
    ].flatMap((datei) =>
      [...readFileSync(datei, 'utf8').matchAll(/^\s*image:\s*(pgvector\/pgvector:\S+)/gm)].map(
        ([, abbild]) => `${datei}: ${abbild}`,
      ),
    );

    expect(abbilder.length).toBeGreaterThanOrEqual(4);
    expect(new Set(abbilder.map((zeile) => zeile.split(': ')[1])).size, abbilder.join('\n')).toBe(
      1,
    );
  });
});
