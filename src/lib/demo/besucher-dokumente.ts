import { and, asc, eq, isNull, lte, ne } from 'drizzle-orm';
import { db } from '@/lib/db';
import { documentVersions, documents } from '@/lib/db/schema';
import { dokumentLoeschen } from '@/lib/documents/loeschen';

/*
 * Die Dateien, die ein Besuch selbst in die Demo geladen hat.
 *
 * Sie liegen im Demo-Konto, sind aber über `besucherHash` einem Besuch
 * zugeordnet. Jede Abfrage hier filtert darauf — es gibt keinen Weg, an die
 * Dateien eines anderen Besuchs zu kommen, und der Endpunkt gibt ohnehin nie
 * IDs aus dem Browser weiter.
 */

export type BesucherDokument = {
  id: string;
  filename: string;
  status: string | null;
  errorCode: string | null;
  ablaufAm: Date | null;
};

export async function eigeneDokumente(
  userId: string,
  besucherHash: string,
): Promise<BesucherDokument[]> {
  return db
    .select({
      id: documents.id,
      filename: documents.filename,
      status: documentVersions.status,
      errorCode: documentVersions.errorCode,
      ablaufAm: documents.ablaufAm,
    })
    .from(documents)
    .leftJoin(documentVersions, eq(documentVersions.documentId, documents.id))
    .where(
      and(
        eq(documents.userId, userId),
        eq(documents.besucherHash, besucherHash),
        isNull(documents.deletedAt),
      ),
    )
    .orderBy(asc(documents.createdAt));
}

/**
 * Löscht abgelaufene Demo-Uploads — Zeile, Abschnitte, Vektoren und Datei.
 *
 * Über dieselbe Löschkaskade wie im angemeldeten Bereich. Ein eigener,
 * kürzerer Weg wäre die Stelle, an der das Löschen später unvollständig
 * wird.
 *
 * Gibt zurück, wie viele Dokumente verschwunden sind — der Aufrufer
 * protokolliert das, damit im Betrieb sichtbar ist, dass es wirklich läuft.
 */
export async function abgelaufeneLoeschen(jetzt: Date = new Date()): Promise<number> {
  const faellig = await db
    .select({ id: documents.id, userId: documents.userId })
    .from(documents)
    .where(
      and(
        ne(documents.besucherHash, ''),
        lte(documents.ablaufAm, jetzt),
        isNull(documents.deletedAt),
      ),
    );

  let weg = 0;
  for (const zeile of faellig) {
    const ergebnis = await dokumentLoeschen(zeile.userId, zeile.id);
    if (ergebnis.ok) weg += 1;
  }
  return weg;
}
