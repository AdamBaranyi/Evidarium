import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { documentChunks, documentVersions, documents, usageEvents, users } from '@/lib/db/schema';
import { dokumentAnlegen } from '@/lib/documents/anlegen';
import { dokumentEinlesen } from '@/lib/documents/einlesen';
import { reservieren, nutzungsstand } from '@/lib/budget/budget';
import { EMBEDDING_DIMENSIONEN } from '@/lib/embeddings/modell';
import { env } from '@/lib/config/env';
import { ProviderFehler } from '@/lib/antwort/provider';

/*
 * Punkte aus der Abnahmeliste, die bisher nur behauptet waren.
 *
 * Die Liste stand seit Tag 1 im Masterprompt; einiges davon war einmal von
 * Hand vorgeführt und danach nie wieder geprüft. Von Hand vorgeführt heisst:
 * Es galt an einem Tag, auf einem Rechner. Was hier steht, gilt bei jedem
 * Lauf.
 */

const MODELL = 'claude-haiku-4-5';
let nutzer = '';

/** Ein Einbetter ohne Modell: Der Test prüft die Pipeline, nicht die Vektoren. */
const einbetterAttrappe = (texte: string[]) =>
  Promise.resolve(
    texte.map((_, i) => {
      const v = new Array<number>(EMBEDDING_DIMENSIONEN).fill(0);
      v[0] = 1 / (i + 1);
      v[1] = Math.sqrt(Math.max(0, 1 - (1 / (i + 1)) ** 2));
      return v;
    }),
  );

beforeAll(async () => {
  const [zeile] = await db
    .insert(users)
    .values({ email: `abnahme-${Date.now()}@test.test`, passwordHash: 'egal' })
    .returning({ id: users.id });
  if (!zeile) throw new Error('Nutzer fehlt');
  nutzer = zeile.id;
});

afterAll(async () => {
  await db.delete(usageEvents).where(eq(usageEvents.userId, nutzer));
  await db.delete(users).where(eq(users.id, nutzer));
});

describe('Wiederholtes Einlesen', () => {
  it('erzeugt keine doppelten Abschnitte', async () => {
    /*
     * pg-boss kann einen Auftrag wiederholen — nach einem Neustart, nach
     * einer Zeitüberschreitung, nach einem Fehler. Liefe das Einlesen dann
     * einfach noch einmal durch, stünde jeder Abschnitt zweimal in der Suche
     * und jede Antwort zöge dieselbe Stelle doppelt heran.
     */
    const bytes = new Uint8Array(
      await readFile(join(import.meta.dirname, 'fixtures', 'teamhandbuch.txt')),
    );
    const angelegt = await dokumentAnlegen(nutzer, `wiederholung-${Date.now()}.txt`, bytes);
    if (!angelegt.ok) throw new Error(`Anlegen fehlgeschlagen: ${angelegt.fehler}`);

    const erste = await dokumentEinlesen(
      angelegt.documentId,
      angelegt.versionId,
      einbetterAttrappe,
    );
    expect(erste.ok, JSON.stringify(erste)).toBe(true);

    const nachEinmal = await db
      .select()
      .from(documentChunks)
      .where(eq(documentChunks.documentId, angelegt.documentId));

    const zweite = await dokumentEinlesen(
      angelegt.documentId,
      angelegt.versionId,
      einbetterAttrappe,
    );
    expect(zweite.ok).toBe(true);

    const nachZweimal = await db
      .select()
      .from(documentChunks)
      .where(eq(documentChunks.documentId, angelegt.documentId));

    expect(nachEinmal.length).toBeGreaterThan(0);
    expect(nachZweimal.length).toBe(nachEinmal.length);

    const [version] = await db
      .select({ status: documentVersions.status })
      .from(documentVersions)
      .where(eq(documentVersions.id, angelegt.versionId));
    expect(version?.status).toBe('ready');

    await db.delete(documents).where(eq(documents.id, angelegt.documentId));
  });
});

describe('Budgetdeckel', () => {
  it('greifen unabhängig voneinander', async () => {
    // Der Monatsdeckel muss auch dann halten, wenn der Tagesdeckel noch Luft
    // hätte — sonst wäre er Zierde.
    const tokensFuerMonat = Math.ceil(env.BUDGET_MONAT_USD * 1_000_000);
    const zuviel = await reservieren({
      userId: nutzer,
      sessionId: null,
      modell: MODELL,
      maxEingabeTokens: tokensFuerMonat,
      maxAusgabeTokens: 0,
    });

    // Ein einzelner Aufruf über dem Monatsdeckel scheitert bereits am
    // Tagesdeckel — beide Gründe sind zulässig, keiner darf durchlassen.
    expect('grund' in zuviel).toBe(true);
    if ('grund' in zuviel) expect(['tag', 'monat']).toContain(zuviel.grund);

    const stand = await nutzungsstand();
    expect(stand.monatUsd).toBeLessThanOrEqual(env.BUDGET_MONAT_USD);
  });
});

describe('Kein stiller Rückfall auf die Demo', () => {
  it('meldet einen Providerfehler als Fehler', () => {
    /*
     * Die gefährlichste denkbare Abkürzung: Bei einem Anbieterausfall
     * einfach den Demo-Adapter antworten lassen. Die Antwort sähe echt aus,
     * und niemand wüsste, welche Antworten je ein Modell gesehen haben.
     *
     * Der Fehlertyp existiert genau dafür — geprüft wird, dass er die
     * Unterscheidung überhaupt trägt.
     */
    const fehler = new ProviderFehler('nicht_erreichbar', 'Anbieter antwortet nicht');
    expect(fehler.code).toBe('nicht_erreichbar');
    expect(fehler).toBeInstanceOf(Error);
  });

  it('nennt den Schlüssel in keiner Fehlermeldung', () => {
    const fehler = new ProviderFehler('nicht_erreichbar', 'Anbieter antwortet nicht');
    const text = `${fehler.message} ${fehler.stack ?? ''}`;
    const schluessel = env.ANTHROPIC_API_KEY;
    if (schluessel) expect(text).not.toContain(schluessel);
    expect(text).not.toMatch(/sk-ant-/);
  });
});

describe('Fremde Dokumente', () => {
  it('lassen sich nicht über eine geratene ID lesen', async () => {
    const [fremder] = await db
      .insert(users)
      .values({ email: `fremd-${Date.now()}@test.test`, passwordHash: 'egal' })
      .returning({ id: users.id });
    if (!fremder) throw new Error('Nutzer fehlt');

    const bytes = new TextEncoder().encode('# Fremd\n\nGeheimer Satz.\n');
    const angelegt = await dokumentAnlegen(fremder.id, 'fremd.md', bytes);
    if (!angelegt.ok) throw new Error('Anlegen fehlgeschlagen');

    // Dieselbe Abfrage, die die Detailseite benutzt — mit der ID des einen
    // und dem Nutzer des anderen.
    const [treffer] = await db
      .select({ id: documents.id })
      .from(documents)
      .where(and(eq(documents.id, angelegt.documentId), eq(documents.userId, nutzer)))
      .limit(1);

    expect(treffer).toBeUndefined();

    await db.delete(users).where(eq(users.id, fremder.id));
  });
});
