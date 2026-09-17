import { createHash } from 'node:crypto';
import { and, count, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { documentVersions, documents } from '@/lib/db/schema';
import { erkenneTyp } from './dateityp';
import { CHUNKER_VERSION, GRENZEN, PARSER_VERSION } from './grenzen';
import { ablegen } from './speicher';

export type AnlegenFehler =
  'zu_gross' | 'typ_nicht_unterstuetzt' | 'zu_viele_dokumente' | 'schon_vorhanden';

export type AnlegenErgebnis =
  { ok: true; documentId: string; versionId: string } | { ok: false; fehler: AnlegenFehler };

/**
 * Nimmt eine hochgeladene Datei an und legt Dokument und erste Version an.
 *
 * Wartet **nicht** auf die Verarbeitung: Der Aufrufer reiht danach einen Job
 * ein und antwortet sofort.
 */
export async function dokumentAnlegen(
  userId: string,
  dateiname: string,
  bytes: Uint8Array,
): Promise<AnlegenErgebnis> {
  if (bytes.byteLength > GRENZEN.maxBytes) return { ok: false, fehler: 'zu_gross' };

  // Typ am Inhalt, nicht am Namen und nicht am behaupteten MIME-Typ.
  const typ = erkenneTyp(bytes, dateiname);
  if (typ === null) return { ok: false, fehler: 'typ_nicht_unterstuetzt' };

  const [bestand] = await db
    .select({ anzahl: count() })
    .from(documents)
    .where(and(eq(documents.userId, userId), isNull(documents.deletedAt)));

  if ((bestand?.anzahl ?? 0) >= GRENZEN.maxDokumenteJeNutzer) {
    return { ok: false, fehler: 'zu_viele_dokumente' };
  }

  const contentHash = createHash('sha256').update(bytes).digest('hex');

  // Dubletten nur innerhalb desselben Nutzers: Ein Treffer über Nutzergrenzen
  // hinweg würde verraten, dass jemand anderes dieselbe Datei hat.
  const [doppelt] = await db
    .select({ id: documents.id })
    .from(documents)
    .where(and(eq(documents.userId, userId), eq(documents.contentHash, contentHash)))
    .limit(1);

  if (doppelt) return { ok: false, fehler: 'schon_vorhanden' };

  const documentId = crypto.randomUUID();
  // Der Pfad entsteht aus IDs, nie aus dem Dateinamen.
  const storagePath = await ablegen(userId, documentId, bytes);

  const versionId = await db.transaction(async (tx) => {
    await tx.insert(documents).values({
      id: documentId,
      userId,
      filename: dateiname,
      kind: typ,
      sizeBytes: bytes.byteLength,
      contentHash,
      storagePath,
    });
    const [version] = await tx
      .insert(documentVersions)
      .values({
        documentId,
        parserVersion: PARSER_VERSION,
        chunkerVersion: CHUNKER_VERSION,
        status: 'pending',
      })
      .returning({ id: documentVersions.id });

    if (!version) throw new Error('Version konnte nicht angelegt werden');
    return version.id;
  });

  return { ok: true, documentId, versionId };
}
