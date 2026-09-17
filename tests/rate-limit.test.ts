import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { loginAttempts } from '@/lib/db/schema';
import { fehlversuchNotieren, fehlversucheLoeschen, loginErlaubt } from '@/lib/auth/rate-limit';

const HERKUNFT = 'test-herkunft-rate-limit';

async function aufraeumen() {
  await db.delete(loginAttempts).where(eq(loginAttempts.originHash, HERKUNFT));
}

describe('Rate-Limit der Anmeldung', () => {
  beforeEach(aufraeumen);
  afterEach(aufraeumen);

  it('lässt die ersten fünf Versuche zu', async () => {
    for (let i = 0; i < 5; i += 1) {
      expect(await loginErlaubt(HERKUNFT), `Versuch ${i + 1}`).toBe(true);
      await fehlversuchNotieren(HERKUNFT);
    }
  });

  it('sperrt ab dem sechsten Versuch', async () => {
    for (let i = 0; i < 5; i += 1) await fehlversuchNotieren(HERKUNFT);
    expect(await loginErlaubt(HERKUNFT)).toBe(false);
  });

  it('gibt nach erfolgreicher Anmeldung wieder frei', async () => {
    for (let i = 0; i < 5; i += 1) await fehlversuchNotieren(HERKUNFT);
    expect(await loginErlaubt(HERKUNFT)).toBe(false);

    await fehlversucheLoeschen(HERKUNFT);
    expect(await loginErlaubt(HERKUNFT)).toBe(true);
  });

  it('zählt Versuche je Herkunft getrennt', async () => {
    for (let i = 0; i < 5; i += 1) await fehlversuchNotieren(HERKUNFT);
    expect(await loginErlaubt(HERKUNFT)).toBe(false);
    expect(await loginErlaubt('eine-andere-herkunft')).toBe(true);
  });
});
