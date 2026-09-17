import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { documentChunks, documentVersions, documents } from '@/lib/db/schema';
import { erkenneTyp } from './dateityp';
import { ExtraktionsFehler, extrahieren } from './extrahieren';
import { lesen } from './speicher';
import { zerlegen } from './zerlegen';
import { EMBEDDING_MODELL } from '@/lib/embeddings/modell';

/**
 * Die Einbettungsfunktion wird hereingereicht, nicht importiert.
 *
 * Das ist kein Stilentscheid: Diese Datei läuft im Worker, aber sie liegt in
 * der gemeinsamen Bibliothek. Würde sie das Modell selbst importieren, könnte
 * jeder künftige Aufruf aus dem Web-Prozess eine zweite Modellinstanz laden —
 * genau das, was E4 verhindern soll. So gibt es gar keinen Weg dorthin.
 */
export type Einbetter = (texte: string[], art: 'abschnitt') => Promise<number[][]>;

/**
 * Der eigentliche Einlesevorgang. Läuft im Worker, nie in einer Web-Anfrage.
 *
 * Gibt zurück, ob der Fehler endgültig war: Dann darf die Queue nicht noch
 * dreimal dasselbe versuchen. Ein PDF ohne Textschicht wird beim vierten
 * Versuch auch keine haben.
 */
export type EinleseErgebnis = { ok: true } | { ok: false; endgueltig: boolean; code: string };

async function statusSetzen(versionId: string, status: string): Promise<void> {
  await db.update(documentVersions).set({ status }).where(eq(documentVersions.id, versionId));
}

export async function dokumentEinlesen(
  documentId: string,
  versionId: string,
  einbetten: Einbetter,
): Promise<EinleseErgebnis> {
  const [dokument] = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);

  // Vor der Arbeit prüfen, ob sie noch gebraucht wird: Ein Dokument, das
  // inzwischen gelöscht wurde, soll keine Abschnitte mehr erzeugen.
  if (!dokument || dokument.deletedAt !== null) {
    return { ok: false, endgueltig: true, code: 'dokument_weg' };
  }

  const [version] = await db
    .select()
    .from(documentVersions)
    .where(eq(documentVersions.id, versionId))
    .limit(1);

  if (!version || version.documentId !== documentId) {
    return { ok: false, endgueltig: true, code: 'version_weg' };
  }

  try {
    await statusSetzen(versionId, 'extracting');
    const bytes = await lesen(dokument.storagePath);

    const typ = erkenneTyp(bytes, dokument.filename);
    if (typ === null) return await scheitern(versionId, 'typ_nicht_unterstuetzt', true);

    const extraktion = await extrahieren(bytes, typ);

    await statusSetzen(versionId, 'chunking');
    const abschnitte = zerlegen(extraktion.stellen, dokument.filename);
    if (abschnitte.length === 0) return await scheitern(versionId, 'leer', true);

    await statusSetzen(versionId, 'embedding');
    const vektoren = await einbetten(
      abschnitte.map((a) => a.text),
      'abschnitt',
    );
    if (vektoren.length !== abschnitte.length) {
      throw new Error(
        `Einbettung liefert ${vektoren.length} Vektoren für ${abschnitte.length} Abschnitte`,
      );
    }

    /*
     * Alles in einer Transaktion: Abschnitte schreiben, Version fertigmelden,
     * Dokument auf diese Version zeigen lassen. Bricht etwas ab, bleibt die
     * alte Version aktiv und lesbar — nie ein halbfertiger Zwischenstand.
     *
     * Der eindeutige Schlüssel aus Version und Nummer sorgt dafür, dass ein
     * wiederholter Lauf keine doppelten Abschnitte erzeugt.
     */
    await db.transaction(async (tx) => {
      await tx.delete(documentChunks).where(eq(documentChunks.versionId, versionId));
      await tx.insert(documentChunks).values(
        abschnitte.map((a, i) => ({
          versionId,
          documentId,
          ordinal: a.ordinal,
          page: a.page,
          lineStart: a.lineStart,
          lineEnd: a.lineEnd,
          text: a.text,
          charCount: a.text.length,
          // Vektor und Modellname zusammen: Ohne den Namen liesse sich später
          // nicht sagen, welche Vektoren noch vergleichbar sind.
          embedding: vektoren[i] ?? null,
          embeddingModel: EMBEDDING_MODELL,
        })),
      );
      await tx
        .update(documentVersions)
        .set({
          status: 'ready',
          errorCode: null,
          pageCount: extraktion.pageCount,
          charCount: extraktion.charCount,
          chunkCount: abschnitte.length,
          finishedAt: sql`now()`,
        })
        .where(eq(documentVersions.id, versionId));
      await tx
        .update(documents)
        .set({ activeVersionId: versionId })
        .where(eq(documents.id, documentId));
    });

    return { ok: true };
  } catch (fehler) {
    if (fehler instanceof ExtraktionsFehler) {
      // Inhaltliche Fehler wiederholt niemand mit Erfolg.
      return await scheitern(versionId, fehler.code, true);
    }
    // Alles andere kann vorübergehend sein: Datei kurz nicht lesbar,
    // Datenbank überlastet. Die Queue versucht es erneut.
    console.error('[einlesen] unerwarteter Fehler', fehler);
    return await scheitern(versionId, 'unerwartet', false);
  }
}

async function scheitern(
  versionId: string,
  code: string,
  endgueltig: boolean,
): Promise<EinleseErgebnis> {
  if (endgueltig) {
    await db
      .update(documentVersions)
      .set({ status: 'failed', errorCode: code, finishedAt: sql`now()` })
      .where(eq(documentVersions.id, versionId));
  }
  return { ok: false, endgueltig, code };
}
