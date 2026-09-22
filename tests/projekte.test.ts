import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { documents, users } from '@/lib/db/schema';
import {
  dokumentZuordnen,
  PROJEKT_GRENZEN,
  projektAnlegen,
  projekteListen,
  projektLoeschen,
  projektUmbenennen,
} from '@/lib/projekte/projekte';

/*
 * Projekte (E40): Gruppen von Dokumenten.
 *
 * Das Wichtigste hier ist nicht das Anlegen, sondern die Grenze zwischen
 * Konten: Ein Dokument kommt nur in ein Projekt desselben Kontos, und ein
 * fremdes Projekt ist für jede Funktion «nicht gefunden». Der Fremdschlüssel
 * allein sähe das nicht — darum steht es als Test da.
 */

let nutzer = '';
let fremder = '';

async function nutzerAnlegen(name: string): Promise<string> {
  const [zeile] = await db
    .insert(users)
    .values({ email: `${name}-${crypto.randomUUID()}@test.test`, passwordHash: 'egal' })
    .returning({ id: users.id });
  if (!zeile) throw new Error('Nutzer fehlt');
  return zeile.id;
}

async function dokumentAnlegen(userId: string, besucherHash = ''): Promise<string> {
  const [dok] = await db
    .insert(documents)
    .values({
      userId,
      filename: 'notiz.txt',
      kind: 'text',
      sizeBytes: 5,
      contentHash: `hash-${crypto.randomUUID()}`,
      storagePath: '/nirgends',
      besucherHash,
    })
    .returning({ id: documents.id });
  if (!dok) throw new Error('Dokument fehlt');
  return dok.id;
}

async function projektVon(userId: string, name: string): Promise<string> {
  const ergebnis = await projektAnlegen(userId, name);
  if (!ergebnis.ok) throw new Error(ergebnis.fehler);
  return ergebnis.wert.id;
}

beforeAll(async () => {
  nutzer = await nutzerAnlegen('projekte');
  fremder = await nutzerAnlegen('fremd');
});

afterAll(async () => {
  // Projekte und Dokumente hängen per Fremdschlüssel an den Konten.
  await db.delete(users).where(inArray(users.id, [nutzer, fremder]));
});

describe('Projekte anlegen', () => {
  it('räumt den Namen auf und sortiert nach Namen', async () => {
    await projektVon(nutzer, '  Zürich   Büro ');
    await projektVon(nutzer, 'atlas');

    const liste = await projekteListen(nutzer);
    expect(liste.map((p) => p.name)).toEqual(['atlas', 'Zürich Büro']);
  });

  it('lehnt denselben Namen in anderer Schreibweise ab', async () => {
    expect(await projektAnlegen(nutzer, 'ATLAS')).toEqual({ ok: false, fehler: 'gibt_es_schon' });
  });

  it('erlaubt denselben Namen in einem anderen Konto', async () => {
    expect((await projektAnlegen(fremder, 'Atlas')).ok).toBe(true);
  });

  it('lehnt leere und zu lange Namen ab', async () => {
    expect(await projektAnlegen(nutzer, '   ')).toEqual({ ok: false, fehler: 'leer' });
    expect(await projektAnlegen(nutzer, 7)).toEqual({ ok: false, fehler: 'leer' });
    expect(await projektAnlegen(nutzer, 'x'.repeat(PROJEKT_GRENZEN.maxNameZeichen + 1))).toEqual({
      ok: false,
      fehler: 'zu_lang',
    });
  });
});

describe('Grenze zwischen Konten', () => {
  it('ordnet eigene Dokumente eigenen Projekten zu und zählt sie', async () => {
    const projekt = await projektVon(nutzer, 'Zuordnen');
    const dok = await dokumentAnlegen(nutzer);

    expect(await dokumentZuordnen(nutzer, dok, projekt)).toEqual({ ok: true, wert: null });
    const eintrag = (await projekteListen(nutzer)).find((p) => p.id === projekt);
    expect(eintrag?.anzahl).toBe(1);

    expect(await dokumentZuordnen(nutzer, dok, null)).toEqual({ ok: true, wert: null });
  });

  it('nimmt kein fremdes Projekt und kein fremdes Dokument an', async () => {
    const eigenesProjekt = await projektVon(nutzer, 'Eigen');
    const fremdesProjekt = await projektVon(fremder, 'Fremd');
    const eigenesDok = await dokumentAnlegen(nutzer);
    const fremdesDok = await dokumentAnlegen(fremder);

    const nicht = { ok: false, fehler: 'nicht_gefunden' };
    expect(await dokumentZuordnen(nutzer, eigenesDok, fremdesProjekt)).toEqual(nicht);
    expect(await dokumentZuordnen(nutzer, fremdesDok, eigenesProjekt)).toEqual(nicht);
    expect(await projektUmbenennen(nutzer, fremdesProjekt, 'Übernommen')).toEqual(nicht);
    expect(await projektLoeschen(nutzer, fremdesProjekt)).toEqual(nicht);

    // Und nichts davon hat etwas bewegt.
    const [fremdes] = await db.select().from(documents).where(eq(documents.id, fremdesDok));
    expect(fremdes?.projectId).toBeNull();
    expect((await projekteListen(fremder)).some((p) => p.name === 'Fremd')).toBe(true);
  });

  it('lässt Besucherdateien der Demo aus', async () => {
    const projekt = await projektVon(nutzer, 'Demo-Probe');
    const besuch = await dokumentAnlegen(nutzer, 'besucher-hash');
    expect(await dokumentZuordnen(nutzer, besuch, projekt)).toEqual({
      ok: false,
      fehler: 'nicht_gefunden',
    });
  });
});

describe('Umbenennen und Löschen', () => {
  it('benennt um, aber nicht auf einen vergebenen Namen', async () => {
    const projekt = await projektVon(nutzer, 'Alt');
    expect(await projektUmbenennen(nutzer, projekt, 'Neu')).toEqual({ ok: true, wert: null });
    // Auf den eigenen Namen in anderer Schreibweise darf es gehen.
    expect(await projektUmbenennen(nutzer, projekt, 'NEU')).toEqual({ ok: true, wert: null });
    expect(await projektUmbenennen(nutzer, projekt, 'Atlas')).toEqual({
      ok: false,
      fehler: 'gibt_es_schon',
    });
  });

  it('löscht das Projekt, die Dokumente bleiben ohne Projekt', async () => {
    const projekt = await projektVon(nutzer, 'Vergänglich');
    const dok = await dokumentAnlegen(nutzer);
    await dokumentZuordnen(nutzer, dok, projekt);

    expect(await projektLoeschen(nutzer, projekt)).toEqual({ ok: true, wert: null });

    const [bleibt] = await db.select().from(documents).where(eq(documents.id, dok));
    expect(bleibt).toBeDefined();
    expect(bleibt?.projectId).toBeNull();
  });
});
