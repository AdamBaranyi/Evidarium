import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { documentChunks, documentVersions, documents } from '@/lib/db/schema';

/*
 * Jede Abfrage nimmt die Nutzer-ID entgegen und filtert danach. Kein Aufruf
 * lädt erst und prüft dann — sonst gibt es irgendwann einen Pfad, der das
 * Prüfen vergisst.
 */

export type DokumentZeile = {
  id: string;
  filename: string;
  kind: string;
  sizeBytes: number;
  createdAt: Date;
  // Left Join: Ein Dokument ohne Version hätte hier null. Das kommt im
  // Normalfall nicht vor, aber der Typ soll die Abfrage abbilden, nicht die
  // Hoffnung.
  status: string | null;
  errorCode: string | null;
  pageCount: number | null;
  chunkCount: number | null;
};

export async function dokumenteListen(userId: string): Promise<DokumentZeile[]> {
  return db
    .select({
      id: documents.id,
      filename: documents.filename,
      kind: documents.kind,
      sizeBytes: documents.sizeBytes,
      createdAt: documents.createdAt,
      status: documentVersions.status,
      errorCode: documentVersions.errorCode,
      pageCount: documentVersions.pageCount,
      chunkCount: documentVersions.chunkCount,
    })
    .from(documents)
    .leftJoin(documentVersions, eq(documentVersions.documentId, documents.id))
    .where(and(eq(documents.userId, userId), isNull(documents.deletedAt)))
    .orderBy(desc(documents.createdAt), desc(documentVersions.createdAt));
}

export async function dokumentHolen(userId: string, documentId: string) {
  const [zeile] = await db
    .select({
      id: documents.id,
      filename: documents.filename,
      kind: documents.kind,
      sizeBytes: documents.sizeBytes,
      createdAt: documents.createdAt,
      activeVersionId: documents.activeVersionId,
      versionId: documentVersions.id,
      status: documentVersions.status,
      errorCode: documentVersions.errorCode,
      pageCount: documentVersions.pageCount,
      charCount: documentVersions.charCount,
      chunkCount: documentVersions.chunkCount,
      parserVersion: documentVersions.parserVersion,
      chunkerVersion: documentVersions.chunkerVersion,
    })
    .from(documents)
    .leftJoin(documentVersions, eq(documentVersions.documentId, documents.id))
    .where(
      and(eq(documents.id, documentId), eq(documents.userId, userId), isNull(documents.deletedAt)),
    )
    .orderBy(desc(documentVersions.createdAt))
    .limit(1);

  return zeile ?? null;
}

export type AbschnittZeile = {
  ordinal: number;
  page: number | null;
  lineStart: number | null;
  lineEnd: number | null;
  text: string;
};

/**
 * Der extrahierte Text eines Dokuments, nach Seite beziehungsweise Abschnitt.
 * Die Nutzerprüfung sitzt im Join, nicht davor.
 */
export async function abschnitteHolen(
  userId: string,
  documentId: string,
): Promise<AbschnittZeile[]> {
  return db
    .select({
      ordinal: documentChunks.ordinal,
      page: documentChunks.page,
      lineStart: documentChunks.lineStart,
      lineEnd: documentChunks.lineEnd,
      text: documentChunks.text,
    })
    .from(documentChunks)
    .innerJoin(documents, eq(documents.id, documentChunks.documentId))
    .where(
      and(
        eq(documentChunks.documentId, documentId),
        eq(documents.userId, userId),
        isNull(documents.deletedAt),
      ),
    )
    .orderBy(asc(documentChunks.ordinal));
}
