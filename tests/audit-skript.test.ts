import { existsSync, readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { attrappenOrdner, aufrufe, ordnerEntfernen, skriptAusfuehren } from './attrappen';

/*
 * scripts/audit.sh ist die eine Stelle für Stufe und Ausnahmen: Die CI ruft
 * es mit «high» auf und blockiert, der tägliche Lauf mit «moderate» und
 * meldet. Die Attrappe für bun schreibt die Argumente mit und endet mit dem
 * Code aus ATTRAPPE_EXIT.
 */
const BUN = `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$ATTRAPPE_DIR/aufrufe"
exit "\${ATTRAPPE_EXIT:-0}"
`;

function ausnahmen(): string[] {
  const skript = existsSync('scripts/audit.sh') ? readFileSync('scripts/audit.sh', 'utf8') : '';
  return [...skript.matchAll(/^\s*--ignore (GHSA-[a-z0-9-]+)/gm)].map(([, nummer]) => nummer ?? '');
}

let ordner = '';
afterEach(() => ordnerEntfernen(ordner));

describe('scripts/audit.sh', () => {
  it('gibt die Stufe an bun audit weiter, mit allen Ausnahmen', () => {
    ordner = attrappenOrdner({ bun: BUN });
    const { code } = skriptAusfuehren('scripts/audit.sh', ['moderate'], ordner);

    expect(code).toBe(0);
    const [aufruf = ''] = aufrufe(ordner);
    expect(aufruf).toMatch(/^audit --audit-level=moderate /);
    expect(ausnahmen()).toContain('GHSA-67mh-4wv8-2f99');
    for (const nummer of ausnahmen()) expect(aufruf).toContain(`--ignore ${nummer}`);
  });

  it('prüft ohne Angabe ab high', () => {
    ordner = attrappenOrdner({ bun: BUN });
    skriptAusfuehren('scripts/audit.sh', [], ordner);

    expect(aufrufe(ordner)[0]).toMatch(/^audit --audit-level=high /);
  });

  it('lässt den Exit-Code von bun audit durch, damit die CI blockiert', () => {
    ordner = attrappenOrdner({ bun: BUN });
    const { code } = skriptAusfuehren('scripts/audit.sh', ['high'], ordner, { ATTRAPPE_EXIT: '1' });

    expect(code).toBe(1);
  });

  it('jede Ausnahme ist in docs/SECURITY.md begründet und befristet', () => {
    const doku = readFileSync('docs/SECURITY.md', 'utf8').split(/^### /m);

    expect(ausnahmen().length).toBeGreaterThan(0);
    for (const nummer of ausnahmen()) {
      const abschnitt = doku.find((teil) => teil.startsWith(nummer));
      expect(abschnitt, `${nummer} fehlt in docs/SECURITY.md`).toBeDefined();
      expect(abschnitt).toMatch(/Prüfen bis:\*\*\s*\d{2}\.\d{2}\.\d{4}/);
    }
  });
});
