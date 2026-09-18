import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { documentChunks, documentVersions, documents, users } from '@/lib/db/schema';
import { EMBEDDING_DIMENSIONEN, EMBEDDING_MODELL } from '@/lib/embeddings/modell';
import { dokumentLoeschen } from '@/lib/documents/loeschen';
import { suchen } from '@/lib/search/suchen';

/*
 * Löschen ist die Probe darauf, ob «weg» wirklich weg heisst.
 *
 * Geprüft wird nicht, ob das Dokument aus der Liste verschwindet — das täte
 * auch ein Ausblenden. Geprüft wird, ob **Abschnitte, Vektoren und Datei**
 * verschwinden und ob die Suche das Dokument danach nicht mehr findet.
 */

function vektor(erstes: number): number[] {
  const v = new Array<number>(EMBEDDING_DIMENSIONEN).fill(0);
  v[0] = erstes;
  v[1] = Math.sqrt(Math.max(0, 1 - erstes * erstes));
  return v;
}

let nutzer = '';
let fremder = '';
let ordner = '';

async function nutzerAnlegen(name: string): Promise<string> {
  const [zeile] = await db
    .insert(users)
    .values({ email: `${name}-${Date.now()}@test.test`, passwordHash: 'egal' })
    .returning({ id: users.id });
  if (!zeile) throw new Error('Nutzer fehlt');
  return zeile.id;
}

async function dokumentAnlegen(userId: string, name: string): Promise<[string, string]> {
  const pfad = join(ordner, `${name}-${Date.now()}`);
  await writeFile(pfad, 'Inhalt der Datei');

  const [dok] = await db
    .insert(documents)
    .values({
      userId,
      filename: name,
      kind: 'text',
      sizeBytes: 16,
      contentHash: `hash-${name}-${userId}-${Date.now()}`,
      storagePath: pfad,
    })
    .returning({ id: documents.id });
  if (!dok) throw new Error('Dokument fehlt');

  const [version] = await db
    .insert(documentVersions)
    .values({
      documentId: dok.id,
      status: 'ready',
      parserVersion: 'test',
      chunkerVersion: 'test',
      charCount: 16,
      chunkCount: 1,
    })
    .returning({ id: documentVersions.id });
  if (!version) throw new Error('Version fehlt');

  await db.insert(documentChunks).values({
    documentId: dok.id,
    versionId: version.id,
    ordinal: 0,
    page: 1,
    text: `${name}\n\nBeim Onboarding hilft Mara Keller.`,
    charCount: 40,
    embedding: vektor(1),
    embeddingModel: EMBEDDING_MODELL,
  });

  await db.update(documents).set({ activeVersionId: version.id }).where(eq(documents.id, dok.id));
  return [dok.id, pfad];
}

beforeAll(async () => {
  ordner = await mkdtemp(join(tmpdir(), 'evidarium-loeschen-'));
  nutzer = await nutzerAnlegen('eigner');
  fremder = await nutzerAnlegen('fremd');
});

afterAll(async () => {
  await db.delete(users).where(eq(users.id, nutzer));
  await db.delete(users).where(eq(users.id, fremder));
});

describe('Dokument löschen', () => {
  it('entfernt Zeile, Abschnitte und Datei', async () => {
    const [id, pfad] = await dokumentAnlegen(nutzer, 'weg.txt');

    expect(await readFile(pfad, 'utf8')).toBe('Inhalt der Datei');

    const ergebnis = await dokumentLoeschen(nutzer, id);
    expect(ergebnis.ok).toBe(true);

    expect(await db.select().from(documents).where(eq(documents.id, id))).toHaveLength(0);
    expect(
      await db.select().from(documentChunks).where(eq(documentChunks.documentId, id)),
    ).toHaveLength(0);
    expect(
      await db.select().from(documentVersions).where(eq(documentVersions.documentId, id)),
    ).toHaveLength(0);
    await expect(readFile(pfad, 'utf8')).rejects.toThrow();
  });

  it('nimmt das Dokument aus der Suche', async () => {
    const [id] = await dokumentAnlegen(nutzer, 'suchbar.txt');

    const vorher = await suchen(nutzer, [id], 'Onboarding', vektor(1));
    expect(vorher.length).toBeGreaterThan(0);

    await dokumentLoeschen(nutzer, id);

    // Die Suche filtert selbst auf den Nutzer; eine gelöschte ID darf auch
    // dann nichts liefern, wenn jemand sie sich gemerkt hat.
    expect(await suchen(nutzer, [id], 'Onboarding', vektor(1))).toHaveLength(0);
  });

  it('löscht nichts, was einem anderen gehört', async () => {
    const [id, pfad] = await dokumentAnlegen(nutzer, 'fremd.txt');

    const ergebnis = await dokumentLoeschen(fremder, id);
    expect(ergebnis.ok).toBe(false);

    expect(await db.select().from(documents).where(eq(documents.id, id))).toHaveLength(1);
    expect(await readFile(pfad, 'utf8')).toBe('Inhalt der Datei');
  });

  it('meldet ein zweites Löschen als nicht gefunden', async () => {
    const [id] = await dokumentAnlegen(nutzer, 'zweimal.txt');
    expect((await dokumentLoeschen(nutzer, id)).ok).toBe(true);
    expect((await dokumentLoeschen(nutzer, id)).ok).toBe(false);
  });
});
