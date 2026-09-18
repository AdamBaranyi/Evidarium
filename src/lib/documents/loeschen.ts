import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { documentVersions, documents } from '@/lib/db/schema';
import { entfernen } from './speicher';

/*
 * Löschen heisst hier **wirklich löschen**, nicht ausblenden.
 *
 * Ein Dokument, das nur aus der Liste verschwindet, dessen Abschnitte und
 * Vektoren aber liegen bleiben, taucht in der nächsten Antwort wieder auf —
 * als Beleg zu einem Dokument, das es angeblich nicht mehr gibt. Das wäre
 * schlimmer als gar keine Löschfunktion, weil es Vertrauen missbraucht.
 *
 * Reihenfolge mit Absicht:
 *
 *   1. `deleted_at` setzen. Ab hier ist das Dokument für jede Abfrage weg,
 *      selbst wenn die folgenden Schritte scheitern.
 *   2. Versionen löschen — die Abschnitte samt Vektoren hängen per
 *      `ON DELETE CASCADE` daran.
 *   3. Datei vom Datenträger entfernen.
 *   4. Zeile entfernen, damit dieselbe Datei wieder hochgeladen werden kann.
 *      Bliebe sie stehen, meldete der Inhaltshash «schon vorhanden».
 *
 * Bricht es zwischendrin ab, bleibt ein markiertes, unsichtbares Dokument
 * zurück. Das ist die richtige Richtung zum Scheitern: lieber unsichtbar und
 * wiederholbar als wieder sichtbar.
 */

export type LoeschErgebnis = { ok: true } | { ok: false; grund: 'nicht_gefunden' };

export async function dokumentLoeschen(
  userId: string,
  documentId: string,
): Promise<LoeschErgebnis> {
  // Die Nutzerprüfung steckt in der Bedingung, nicht in einem Schritt davor.
  const [zeile] = await db
    .update(documents)
    .set({ deletedAt: new Date(), activeVersionId: null })
    .where(
      and(eq(documents.id, documentId), eq(documents.userId, userId), isNull(documents.deletedAt)),
    )
    .returning({ id: documents.id, storagePath: documents.storagePath });

  if (!zeile) return { ok: false, grund: 'nicht_gefunden' };

  await db.delete(documentVersions).where(eq(documentVersions.documentId, documentId));
  await entfernen(zeile.storagePath);
  await db.delete(documents).where(eq(documents.id, documentId));

  return { ok: true };
}
