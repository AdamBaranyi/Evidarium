import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { usageEvents, users } from '@/lib/db/schema';
import { fragenVonHerkunftHeute, reservieren } from '@/lib/budget/budget';
import { besucherKennung, cookieKopf, neueBesucherkennung } from '@/lib/demo/besucher';

/*
 * Die Demo hängt an einem fremden Geldbeutel. Was sie begrenzt, gehört
 * darum geprüft — auch das, was leicht zu umgehen ist: Ein Zähler, der gar
 * nicht zählt, wiegt in falscher Sicherheit.
 */

const MODELL = 'claude-haiku-4-5';
let nutzer = '';

beforeAll(async () => {
  const [zeile] = await db
    .insert(users)
    .values({ email: `demo-${Date.now()}@test.test`, passwordHash: 'egal' })
    .returning({ id: users.id });
  if (!zeile) throw new Error('Nutzer fehlt');
  nutzer = zeile.id;
});

afterAll(async () => {
  await db.delete(usageEvents).where(eq(usageEvents.userId, nutzer));
  await db.delete(users).where(eq(users.id, nutzer));
});

describe('Besucherkennung', () => {
  it('ist bei gleichem Cookie gleich und sonst verschieden', () => {
    const a = neueBesucherkennung();
    const b = neueBesucherkennung();
    expect(besucherKennung(a)).toBe(besucherKennung(a));
    expect(besucherKennung(a)).not.toBe(besucherKennung(b));
  });

  it('gibt den Cookie-Wert nicht preis', () => {
    // Gespeichert wird der Hash. Stünde der Wert selbst in der Datenbank,
    // wäre eine Kopie davon ein zweiter Zugang zum Kontingent.
    const wert = neueBesucherkennung();
    expect(besucherKennung(wert)).not.toContain(wert);
    expect(besucherKennung(wert).startsWith('demo:')).toBe(true);
  });

  it('setzt das Cookie unzugänglich für Skripte', () => {
    const kopf = cookieKopf('abc', false);
    expect(kopf).toContain('HttpOnly');
    expect(kopf).toContain('SameSite=Lax');
    expect(kopf).not.toContain('Secure');
    expect(cookieKopf('abc', true)).toContain('Secure');
  });
});

describe('Fragen je Herkunft', () => {
  it('zählt nur die eigene Herkunft', async () => {
    const hier = `herkunft-a-${Date.now()}`;
    const dort = `herkunft-b-${Date.now()}`;

    expect(await fragenVonHerkunftHeute(hier)).toBe(0);

    for (let i = 0; i < 3; i += 1) {
      await reservieren({
        userId: nutzer,
        sessionId: null,
        originHash: hier,
        modell: MODELL,
        maxEingabeTokens: 100,
        maxAusgabeTokens: 10,
      });
    }

    expect(await fragenVonHerkunftHeute(hier)).toBe(3);
    expect(await fragenVonHerkunftHeute(dort)).toBe(0);
  });

  it('zählt Aufrufe ohne Herkunft nicht mit', async () => {
    // Der angemeldete Chat schreibt keine Herkunft. Täte der Zähler so, als
    // gehörten diese Zeilen irgendwohin, sperrte die Demo grundlos.
    const herkunft = `herkunft-c-${Date.now()}`;
    await reservieren({
      userId: nutzer,
      sessionId: null,
      modell: MODELL,
      maxEingabeTokens: 100,
      maxAusgabeTokens: 10,
    });
    expect(await fragenVonHerkunftHeute(herkunft)).toBe(0);
  });
});

describe('Kurz speichern', () => {
  it('entfernt den Herkunfts-Hash nach 24 Stunden und lässt das Protokoll stehen', async () => {
    const { personendatenKuerzen } = await import('@/lib/betrieb/aufraeumen');
    const herkunft = `herkunft-alt-${Date.now()}`;
    const e = await reservieren({
      userId: nutzer,
      sessionId: null,
      originHash: herkunft,
      modell: MODELL,
      maxEingabeTokens: 100,
      maxAusgabeTokens: 10,
    });
    if (!('id' in e)) throw new Error('Reservierung fehlt');

    // Zwei Tage in die Zukunft: der Eintrag ist dann älter als 24 Stunden.
    await personendatenKuerzen(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000));

    const [zeile] = await db.select().from(usageEvents).where(eq(usageEvents.id, e.id));
    expect(zeile).toBeDefined();
    expect(zeile?.originHash).toBeNull();
    // Kosten und Modell bleiben — die braucht die Abrechnung.
    expect(zeile?.modell).toBe(MODELL);
  });
});
