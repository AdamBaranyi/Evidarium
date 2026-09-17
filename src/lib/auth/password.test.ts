import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

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
