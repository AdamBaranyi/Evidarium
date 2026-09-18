import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { documents, users } from '@/lib/db/schema';
import { dokumentAnlegen } from '@/lib/documents/anlegen';
import { abgelaufeneLoeschen, eigeneDokumente } from '@/lib/demo/besucher-dokumente';
import { DEMO_GRENZEN } from '@/lib/demo/grenzen';

/*
 * Die Zusage lautet: höchstens drei Dateien je Besuch, und nach 24 Stunden
 * sind sie weg. Beides ist geprüft — eine Zusage, die niemand nachmisst, ist
 * ein Satz auf einer Seite.
 */

let konto = '';
const BESUCH_A = 'demo:aaaa';
const BESUCH_B = 'demo:bbbb';

async function testdatei(): Promise<Uint8Array> {
  return new Uint8Array(await readFile(join(import.meta.dirname, 'fixtures', 'teamhandbuch.txt')));
}

function mitInhalt(text: string): Uint8Array {
  return new TextEncoder().encode(`# Test\n\n${text}\n`);
}

beforeAll(async () => {
  const [zeile] = await db
    .insert(users)
    .values({ email: `demo-upload-${Date.now()}@test.test`, passwordHash: 'egal' })
    .returning({ id: users.id });
  if (!zeile) throw new Error('Konto fehlt');
  konto = zeile.id;
});

afterAll(async () => {
  await db.delete(users).where(eq(users.id, konto));
});

describe('Eigene Dateien in der Demo', () => {
  it('begrenzt die Zahl je Besuch, nicht je Konto', async () => {
    for (let i = 0; i < DEMO_GRENZEN.maxDateien; i += 1) {
      const ergebnis = await dokumentAnlegen(konto, `a-${i}.md`, mitInhalt(`Datei A ${i}`), {
        besucherHash: BESUCH_A,
        maxDateien: DEMO_GRENZEN.maxDateien,
      });
      expect(ergebnis.ok, `Datei ${i + 1} sollte durchgehen`).toBe(true);
    }

    const zuviel = await dokumentAnlegen(konto, 'a-zuviel.md', mitInhalt('noch eine'), {
      besucherHash: BESUCH_A,
      maxDateien: DEMO_GRENZEN.maxDateien,
    });
    expect(zuviel.ok).toBe(false);

    // Ein anderer Besuch hat sein eigenes Kontingent.
    const anderer = await dokumentAnlegen(konto, 'b-1.md', mitInhalt('Datei B'), {
      besucherHash: BESUCH_B,
      maxDateien: DEMO_GRENZEN.maxDateien,
    });
    expect(anderer.ok).toBe(true);
  });

  it('lässt zwei Besuche dieselbe Datei hochladen', async () => {
    /*
     * Sonst verriete ein abgelehnter Upload, dass jemand anderes dieselbe
     * Datei hat — und der zweite Besuch käme gar nicht erst zum Fragen.
     */
    const inhalt = await testdatei();
    const ersteR = await dokumentAnlegen(konto, 'gleich.txt', inhalt, { besucherHash: 'demo:c1' });
    const zweiteR = await dokumentAnlegen(konto, 'gleich.txt', inhalt, { besucherHash: 'demo:c2' });
    expect(ersteR.ok).toBe(true);
    expect(zweiteR.ok).toBe(true);
  });

  it('erkennt dieselbe Datei innerhalb eines Besuchs als Dublette', async () => {
    const inhalt = mitInhalt('einmalig');
    expect((await dokumentAnlegen(konto, 'd.md', inhalt, { besucherHash: 'demo:d' })).ok).toBe(
      true,
    );
    const nochmal = await dokumentAnlegen(konto, 'd.md', inhalt, { besucherHash: 'demo:d' });
    expect(nochmal.ok).toBe(false);
  });

  it('zeigt einem Besuch nur seine eigenen Dateien', async () => {
    const a = await eigeneDokumente(konto, BESUCH_A);
    const b = await eigeneDokumente(konto, BESUCH_B);
    expect(a).toHaveLength(DEMO_GRENZEN.maxDateien);
    expect(b).toHaveLength(1);
    expect(a.map((d) => d.filename)).not.toContain('b-1.md');
  });

  it('löscht abgelaufene Dateien und lässt die übrigen stehen', async () => {
    const frisch = await dokumentAnlegen(konto, 'frisch.md', mitInhalt('bleibt'), {
      besucherHash: 'demo:e',
      ablaufAm: new Date(Date.now() + 60_000),
    });
    const alt = await dokumentAnlegen(konto, 'alt.md', mitInhalt('geht weg'), {
      besucherHash: 'demo:e',
      ablaufAm: new Date(Date.now() - 60_000),
    });
    if (!frisch.ok || !alt.ok) throw new Error('Aufbau fehlgeschlagen');

    const weg = await abgelaufeneLoeschen();
    expect(weg).toBeGreaterThanOrEqual(1);

    expect(await db.select().from(documents).where(eq(documents.id, alt.documentId))).toHaveLength(
      0,
    );
    expect(
      await db.select().from(documents).where(eq(documents.id, frisch.documentId)),
    ).toHaveLength(1);
  });

  it('rührt Dateien ohne Ablauf nicht an', async () => {
    // Der vorbereitete Korpus und angemeldete Konten haben kein Ablaufdatum.
    const dauerhaft = await dokumentAnlegen(konto, 'korpus.md', mitInhalt('bleibt immer'));
    if (!dauerhaft.ok) throw new Error('Aufbau fehlgeschlagen');

    await abgelaufeneLoeschen(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000));

    expect(
      await db.select().from(documents).where(eq(documents.id, dauerhaft.documentId)),
    ).toHaveLength(1);
  });
});
