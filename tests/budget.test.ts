import { afterEach, beforeAll, afterAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { usageEvents, users } from '@/lib/db/schema';
import { abrechnen, alsUnklarMarkieren, nutzungsstand, reservieren } from '@/lib/budget/budget';
import { kostenSchaetzen, modellHatPreis } from '@/lib/budget/preise';
import { env } from '@/lib/config/env';

const MODELL = 'claude-haiku-4-5';
let nutzer = '';

beforeAll(async () => {
  const [zeile] = await db
    .insert(users)
    .values({ email: `budget-${Date.now()}@test.test`, passwordHash: 'egal' })
    .returning({ id: users.id });
  if (!zeile) throw new Error('Nutzer fehlt');
  nutzer = zeile.id;
});

afterEach(async () => {
  await db.delete(usageEvents).where(eq(usageEvents.userId, nutzer));
});

afterAll(async () => {
  await db.delete(users).where(eq(users.id, nutzer));
});

describe('Preistabelle', () => {
  it('kennt das eingesetzte Modell', () => {
    expect(modellHatPreis(MODELL)).toBe(true);
  });

  it('findet den Preis auch mit Datumszusatz des Anbieters', () => {
    // Der Anbieter meldet `claude-haiku-4-5-20251001` zurück.
    expect(modellHatPreis('claude-haiku-4-5-20251001')).toBe(true);
  });

  it('kennt ein erfundenes Modell nicht', () => {
    expect(modellHatPreis('claude-gibt-es-nicht')).toBe(false);
  });

  it('rechnet nach der hinterlegten Tabelle', () => {
    // 1 Mio. Eingabe zu 1 USD, 1 Mio. Ausgabe zu 5 USD.
    expect(kostenSchaetzen(MODELL, 1_000_000, 1_000_000)).toBeCloseTo(6.0, 5);
  });
});

describe('Budgetgrenzen', () => {
  it('sperrt ein Modell ohne hinterlegten Preis', async () => {
    const ergebnis = await reservieren({
      userId: nutzer,
      sessionId: null,
      modell: 'claude-gibt-es-nicht',
      maxEingabeTokens: 1000,
      maxAusgabeTokens: 100,
    });
    expect('grund' in ergebnis && ergebnis.grund).toBe('kein_preis');
  });

  it('begrenzt die Fragen je Sitzung', async () => {
    const sitzung = `sitzung-${Date.now()}`;

    for (let i = 0; i < env.FRAGEN_JE_SITZUNG; i += 1) {
      const e = await reservieren({
        userId: nutzer,
        sessionId: sitzung,
        modell: MODELL,
        maxEingabeTokens: 100,
        maxAusgabeTokens: 10,
      });
      expect('id' in e, `Frage ${i + 1} sollte durchgehen`).toBe(true);
    }

    const zuviel = await reservieren({
      userId: nutzer,
      sessionId: sitzung,
      modell: MODELL,
      maxEingabeTokens: 100,
      maxAusgabeTokens: 10,
    });
    expect('grund' in zuviel && zuviel.grund).toBe('sitzung');
  });

  it('zählt Sitzungen getrennt', async () => {
    const a = `a-${Date.now()}`;
    const b = `b-${Date.now()}`;
    for (let i = 0; i < env.FRAGEN_JE_SITZUNG; i += 1) {
      await reservieren({
        userId: nutzer,
        sessionId: a,
        modell: MODELL,
        maxEingabeTokens: 100,
        maxAusgabeTokens: 10,
      });
    }
    expect(
      'grund' in
        (await reservieren({
          userId: nutzer,
          sessionId: a,
          modell: MODELL,
          maxEingabeTokens: 100,
          maxAusgabeTokens: 10,
        })),
    ).toBe(true);
    expect(
      'id' in
        (await reservieren({
          userId: nutzer,
          sessionId: b,
          modell: MODELL,
          maxEingabeTokens: 100,
          maxAusgabeTokens: 10,
        })),
    ).toBe(true);
  });

  it('sperrt, wenn der Tagesdeckel erreicht ist', async () => {
    // Ein einzelner Aufruf, der den Tagesdeckel allein ausschöpft.
    const tokensFuerDeckel = Math.ceil(env.BUDGET_TAG_USD * 1_000_000);
    const erste = await reservieren({
      userId: nutzer,
      sessionId: null,
      modell: MODELL,
      maxEingabeTokens: tokensFuerDeckel,
      maxAusgabeTokens: 0,
    });
    expect('id' in erste).toBe(true);

    const zweite = await reservieren({
      userId: nutzer,
      sessionId: null,
      modell: MODELL,
      maxEingabeTokens: 1000,
      maxAusgabeTokens: 100,
    });
    expect('grund' in zweite && zweite.grund).toBe('tag');
  });

  it('überzieht den Deckel auch bei gleichzeitigen Anfragen nicht', async () => {
    /*
     * Der eigentliche Zweck der Reservierung. Ohne sie sähen alle
     * gleichzeitigen Anfragen beim Prüfen noch Luft und liefen gemeinsam
     * über den Deckel.
     */
    const jeAufruf = env.BUDGET_TAG_USD / 4;
    const tokens = Math.ceil(jeAufruf * 1_000_000);

    const ergebnisse = await Promise.all(
      Array.from({ length: 12 }, () =>
        reservieren({
          userId: nutzer,
          sessionId: null,
          modell: MODELL,
          maxEingabeTokens: tokens,
          maxAusgabeTokens: 0,
        }),
      ),
    );

    const durchgelassen = ergebnisse.filter((e) => 'id' in e).length;
    const stand = await nutzungsstand();

    expect(durchgelassen, 'höchstens vier Viertel passen in den Deckel').toBeLessThanOrEqual(4);
    expect(stand.tagUsd).toBeLessThanOrEqual(env.BUDGET_TAG_USD);
  });
});

describe('Abrechnung', () => {
  it('ersetzt die Reservierung durch die gemessenen Werte', async () => {
    const e = await reservieren({
      userId: nutzer,
      sessionId: null,
      modell: MODELL,
      maxEingabeTokens: 12_000,
      maxAusgabeTokens: 1_200,
    });
    expect('id' in e).toBe(true);
    if (!('id' in e)) return;

    const vorher = (await nutzungsstand()).tagUsd;
    await abrechnen(e, 'claude-haiku-4-5-20251001', 4766, 92);
    const nachher = (await nutzungsstand()).tagUsd;

    // Der tatsächliche Verbrauch liegt weit unter der Reservierung.
    expect(nachher).toBeLessThan(vorher);
    expect(nachher).toBeCloseTo(kostenSchaetzen(MODELL, 4766, 92) ?? 0, 5);
  });

  it('behält die Reservierung, wenn Messwerte fehlen', async () => {
    /*
     * Fehlende Messwerte sind keine Nullkosten: Der Anbieter kann die
     * Anfrage verarbeitet haben, auch wenn die Antwort nie ankam.
     */
    const e = await reservieren({
      userId: nutzer,
      sessionId: null,
      modell: MODELL,
      maxEingabeTokens: 12_000,
      maxAusgabeTokens: 1_200,
    });
    if (!('id' in e)) throw new Error('Reservierung fehlt');

    const reserviert = (await nutzungsstand()).tagUsd;
    await alsUnklarMarkieren(e);
    const danach = (await nutzungsstand()).tagUsd;

    expect(danach).toBeCloseTo(reserviert, 6);

    const [zeile] = await db.select().from(usageEvents).where(eq(usageEvents.id, e.id));
    expect(zeile?.status).toBe('unklar');
  });
});
