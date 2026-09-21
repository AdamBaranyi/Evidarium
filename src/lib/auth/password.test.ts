import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword, passwortPruefenGleichlang } from './password';

describe('Passwort-Hashing', () => {
  it('erkennt das richtige Passwort', async () => {
    const hash = await hashPassword('ein-gutes-Passwort-2026');
    expect(await verifyPassword(hash, 'ein-gutes-Passwort-2026')).toBe(true);
  });

  it('lehnt ein falsches Passwort ab', async () => {
    const hash = await hashPassword('ein-gutes-Passwort-2026');
    expect(await verifyPassword(hash, 'falsch')).toBe(false);
  });

  it('erzeugt für dasselbe Passwort zwei verschiedene Hashes', async () => {
    const a = await hashPassword('gleich');
    const b = await hashPassword('gleich');
    expect(a).not.toBe(b);
  });

  it('gibt bei einem defekten Hash false zurück statt zu werfen', async () => {
    expect(await verifyPassword('kein-argon2-hash', 'egal')).toBe(false);
  });
});

describe('Prüfung gleicher Dauer', () => {
  it('lässt das richtige Passwort durch', async () => {
    const h = await hashPassword('richtig-und-lang-genug');
    expect(await passwortPruefenGleichlang(h, 'richtig-und-lang-genug')).toBe(true);
  });

  it('lehnt ohne Konto ab — nach einer vollen Argon2-Rechnung', async () => {
    /*
     * Die Dauer ist der Punkt. Ohne Konto muss dieselbe Arbeit anfallen wie
     * mit Konto, sonst verrät die Antwortzeit, welche Adressen existieren.
     * Gemessen wird grob: Beide Wege müssen in derselben Grössenordnung
     * liegen, ein Weg ohne Argon2 wäre um ein Vielfaches schneller.
     */
    const h = await hashPassword('irgendein-passwort-lang');

    const start1 = performance.now();
    expect(await passwortPruefenGleichlang(h, 'falsch')).toBe(false);
    const mitKonto = performance.now() - start1;

    const start2 = performance.now();
    expect(await passwortPruefenGleichlang(null, 'falsch')).toBe(false);
    const ohneKonto = performance.now() - start2;

    expect(ohneKonto).toBeGreaterThan(mitKonto * 0.4);
  });

  it('behandelt einen ungültigen Hash wie ein fehlendes Konto', async () => {
    expect(await passwortPruefenGleichlang('kein-anmeldbares-konto', 'egal')).toBe(false);
  });
});
