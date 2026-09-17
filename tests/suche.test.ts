import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { documentChunks, documentVersions, documents, users } from '@/lib/db/schema';
import { EMBEDDING_DIMENSIONEN, EMBEDDING_MODELL } from '@/lib/embeddings/modell';
import { suchen } from '@/lib/search/suchen';

/*
 * Geprüft wird die **Suche**, nicht das Modell.
 *
 * Die Vektoren sind darum von Hand gesetzt und nicht vom Modell erzeugt: So
 * läuft der Test in der CI ohne Modelldownload, und er misst genau das, was
 * er messen soll — die Abfragen, die Mandantentrennung und die Fusion.
 * Die Qualität der Einbettung gehört ins Evaluationsset an Tag 5.
 */

function vektor(erstes: number): number[] {
  const v = new Array<number>(EMBEDDING_DIMENSIONEN).fill(0);
  v[0] = erstes;
  v[1] = Math.sqrt(Math.max(0, 1 - erstes * erstes));
  return v;
}

const ABSCHNITTE = [
  {
    ordinal: 0,
    page: 1,
    text: 'handbuch.pdf\n\nAllgemeine Einführung in die Arbeitsweise.',
    v: 0.1,
  },
  { ordinal: 1, page: 2, text: 'handbuch.pdf\n\nBeim Onboarding hilft Mara Keller.', v: 1.0 },
  { ordinal: 2, page: 3, text: 'handbuch.pdf\n\nDie Sicherung läuft täglich um drei Uhr.', v: 0.2 },
];

let nutzerA = '';
let nutzerB = '';
let dokumentA = '';
let dokumentB = '';

async function nutzerAnlegen(email: string): Promise<string> {
  const [zeile] = await db
    .insert(users)
    .values({ email, passwordHash: 'egal-fuer-diesen-test' })
    .returning({ id: users.id });
  if (!zeile) throw new Error('Nutzer fehlt');
  return zeile.id;
}

async function dokumentMitAbschnitten(userId: string, name: string): Promise<string> {
  const [dok] = await db
    .insert(documents)
    .values({
      userId,
      filename: name,
      kind: 'pdf',
      sizeBytes: 100,
      contentHash: `hash-${name}-${userId}`,
      storagePath: `/nirgends/${name}`,
    })
    .returning({ id: documents.id });
  if (!dok) throw new Error('Dokument fehlt');

  const [version] = await db
    .insert(documentVersions)
    .values({
      documentId: dok.id,
      parserVersion: 'test',
      chunkerVersion: 'test',
      status: 'ready',
    })
    .returning({ id: documentVersions.id });
  if (!version) throw new Error('Version fehlt');

  await db.insert(documentChunks).values(
    ABSCHNITTE.map((a) => ({
      versionId: version.id,
      documentId: dok.id,
      ordinal: a.ordinal,
      page: a.page,
      lineStart: null,
      lineEnd: null,
      text: a.text,
      charCount: a.text.length,
      embedding: vektor(a.v),
      embeddingModel: EMBEDDING_MODELL,
    })),
  );

  await db.update(documents).set({ activeVersionId: version.id }).where(eq(documents.id, dok.id));

  return dok.id;
}

beforeAll(async () => {
  nutzerA = await nutzerAnlegen(`a-${Date.now()}@suche.test`);
  nutzerB = await nutzerAnlegen(`b-${Date.now()}@suche.test`);
  dokumentA = await dokumentMitAbschnitten(nutzerA, 'handbuch.pdf');
  dokumentB = await dokumentMitAbschnitten(nutzerB, 'fremd.pdf');
});

afterAll(async () => {
  await db.delete(users).where(eq(users.id, nutzerA));
  await db.delete(users).where(eq(users.id, nutzerB));
});

describe('Hybridsuche', () => {
  it('findet den passenden Abschnitt semantisch', async () => {
    const treffer = await suchen(nutzerA, [dokumentA], 'völlig andere Wörter', vektor(1.0));

    expect(treffer.length).toBeGreaterThan(0);
    expect(treffer[0]?.text).toContain('Mara Keller');
    expect(treffer[0]?.page).toBe(2);
  });

  it('findet ihn auch rein lexikalisch, wenn der Vektor woanders zeigt', async () => {
    // Der Vektor zeigt auf Abschnitt 1, die Frage nennt einen Namen aus
    // Abschnitt 2. Nur die Volltextsuche kann das auflösen.
    const treffer = await suchen(nutzerA, [dokumentA], 'Mara Keller', vektor(0.1));
    const mara = treffer.find((t) => t.text.includes('Mara Keller'));

    expect(mara, 'Namenstreffer muss gefunden werden').toBeDefined();
    expect(mara?.quellen).toContain('volltext');
  });

  it('feuert bei einer natürlichen Frage auch lexikalisch', async () => {
    /*
     * Regression: `websearch_to_tsquery` verknüpft alle Wörter mit UND. Bei
     * «Wer hilft beim Onboarding?» müsste ein Abschnitt alle vier Wörter
     * enthalten — die lexikalische Hälfte träfe nie, und niemand merkte es,
     * weil die semantische Hälfte Ergebnisse liefert.
     */
    const treffer = await suchen(nutzerA, [dokumentA], 'Wer hilft beim Onboarding?', vektor(0.1));
    const mitVolltext = treffer.filter((t) => t.quellen.includes('volltext'));

    expect(mitVolltext.length, 'lexikalische Hälfte liefert nichts').toBeGreaterThan(0);
  });

  it('setzt einen Abschnitt nach vorn, den beide Verfahren finden', async () => {
    const treffer = await suchen(nutzerA, [dokumentA], 'Onboarding Mara Keller', vektor(1.0));

    expect(treffer[0]?.quellen).toEqual(expect.arrayContaining(['semantisch', 'volltext']));
    // Zwei Quellen ergeben rund die doppelte Punktzahl einer einzelnen.
    expect(treffer[0]?.punkte).toBeGreaterThan(treffer[1]?.punkte ?? 0);
  });

  it('liefert nichts aus fremden Dokumenten, auch wenn die ID stimmt', async () => {
    // Die Dokumentauswahl des Clients ist ein Wunsch, keine Berechtigung.
    const treffer = await suchen(nutzerA, [dokumentB], 'Mara Keller', vektor(1.0));
    expect(treffer).toEqual([]);
  });

  it('liefert nichts ohne Auswahl', async () => {
    expect(await suchen(nutzerA, [], 'Mara Keller', vektor(1.0))).toEqual([]);
  });

  it('lehnt eine Auswahl ab, die keine gültigen IDs enthält', async () => {
    await expect(suchen(nutzerA, ['kein-uuid'], 'egal', vektor(1.0))).rejects.toThrow();
  });
});
