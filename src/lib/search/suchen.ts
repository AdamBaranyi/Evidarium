import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { alsVektorLiteral } from '@/lib/embeddings/modell';

/*
 * Hybridsuche: semantisch über pgvector **und** lexikalisch über die
 * Volltextsuche, danach zusammengeführt.
 *
 * Beide Verfahren machen verschiedene Fehler. Die semantische Suche findet
 * «Wer betreut neue Mitarbeitende?» auch dort, wo «Ansprechperson beim
 * Einstieg» steht — scheitert aber an Eigennamen, Nummern und Abkürzungen,
 * die in ihrem Vektorraum kaum Bedeutung tragen. Die Volltextsuche ist genau
 * dort stark und blind für Umschreibungen. Zusammen decken sie ab, woran
 * jedes einzelne Verfahren scheitert.
 */

export type Treffer = {
  chunkId: string;
  documentId: string;
  filename: string;
  ordinal: number;
  page: number | null;
  lineStart: number | null;
  lineEnd: number | null;
  text: string;
  /** Nur zur Nachvollziehbarkeit, nie als Sicherheit ausgegeben. */
  quellen: string[];
  punkte: number;
};

type RohTreffer = {
  chunkId: string;
  documentId: string;
  filename: string;
  ordinal: number;
  page: number | null;
  lineStart: number | null;
  lineEnd: number | null;
  text: string;
};

/*
 * Je Verfahren bis zu 20 Kandidaten. Mehr bringt wenig, weil die Fusion
 * ohnehin nach Rang gewichtet; weniger lässt gute Treffer liegen, die nur im
 * jeweils anderen Verfahren vorne stehen.
 */
const KANDIDATEN = 20;

/*
 * Der Dämpfungswert der Reciprocal Rank Fusion. 60 ist der Wert aus der
 * ursprünglichen Veröffentlichung von Cormack und Clarke; er sorgt dafür,
 * dass Platz 1 nicht alles überstimmt und Plätze weiter hinten noch zählen.
 *
 * Bewusst dokumentiert und nicht «getunt»: Ein hier veränderter Wert wäre
 * ohne Evaluationsset nicht zu beurteilen.
 */
const RRF_K = 60;

/*
 * Drizzle entfaltet ein JS-Array im SQL-Template zu einer Parameterliste —
 * daraus wird in PostgreSQL ein Record, kein Array, und `ANY(...)` scheitert.
 * Darum ein einziger Textparameter, der serverseitig geteilt wird.
 *
 * Die IDs kommen vom Client. Sie werden vorher als UUID geprüft, damit eine
 * ungültige Eingabe eine saubere Ablehnung ergibt und nicht einen
 * Datenbankfehler mit Typmeldung.
 */
const UuidListe = z.array(z.uuid());

function alsIdListe(documentIds: string[]): string {
  return UuidListe.parse(documentIds).join(',');
}

/**
 * Semantische Treffer. Kosinus-Abstand, weil die Vektoren normalisiert sind.
 *
 * **Kappung nie ohne Sortierung:** Ein `LIMIT` ohne `ORDER BY` wirft nicht
 * deterministisch Kandidaten weg — bei jedem Lauf andere. Das fällt erst auf,
 * wenn eine Antwort ohne erkennbaren Grund eine Fundstelle verliert.
 */
async function semantisch(
  userId: string,
  documentIds: string[],
  vektor: number[],
): Promise<RohTreffer[]> {
  const literal = alsVektorLiteral(vektor);
  const idListe = alsIdListe(documentIds);

  const ergebnis = await db.execute<RohTreffer>(sql`
    SELECT c.id            AS "chunkId",
           c.document_id   AS "documentId",
           d.filename      AS "filename",
           c.ordinal       AS "ordinal",
           c.page          AS "page",
           c.line_start    AS "lineStart",
           c.line_end      AS "lineEnd",
           c.text          AS "text"
      FROM document_chunks c
      JOIN documents d          ON d.id = c.document_id
      JOIN document_versions v  ON v.id = c.version_id
     WHERE d.user_id = ${userId}
       AND d.deleted_at IS NULL
       AND d.active_version_id = c.version_id
       AND v.status = 'ready'
       AND c.embedding IS NOT NULL
       AND c.document_id = ANY(string_to_array(${idListe}, ',')::uuid[])
     ORDER BY c.embedding <=> ${literal}::vector, c.id
     LIMIT ${KANDIDATEN}
  `);

  return ergebnis.rows;
}

/**
 * Lexikalische Treffer über beide Sprachkonfigurationen.
 *
 * Deutsch und Englisch werden zusammen abgefragt: Ein englisches Dokument
 * neben deutschen verschwände sonst aus der Suche, ohne dass jemand merkt,
 * warum.
 */
async function volltext(
  userId: string,
  documentIds: string[],
  frage: string,
): Promise<RohTreffer[]> {
  const idListe = alsIdListe(documentIds);

  /*
   * ODER statt UND, und das ist der entscheidende Punkt.
   *
   * `websearch_to_tsquery('german', 'Wer hilft beim Onboarding?')` ergibt
   * `'wer' & 'hilft' & 'beim' & 'onboarding'` — der Abschnitt müsste alle
   * vier Wörter enthalten. Bei einer natürlichen Frage trifft das nie, und
   * die lexikalische Hälfte der Hybridsuche wäre tot, ohne dass es auffällt:
   * Die semantische Hälfte liefert ja Ergebnisse.
   *
   * Gemessen am 17.09.2026: mit UND null Treffer, mit ODER der richtige
   * Abschnitt auf Platz eins.
   *
   * Die Umwandlung geht über den geparsten Ausdruck, nicht über den Rohtext:
   * `websearch_to_tsquery` hat bereits normalisiert und maskiert, sodass aus
   * der Nutzereingabe keine Operatoren entstehen können. Wortgruppen mit
   * `<->` bleiben unberührt.
   */
  const ergebnis = await db.execute<RohTreffer>(sql`
    WITH anfrage AS (
      SELECT replace(websearch_to_tsquery('german',  ${frage})::text, '&', '|')::tsquery AS de,
             replace(websearch_to_tsquery('english', ${frage})::text, '&', '|')::tsquery AS en
    )
    SELECT c.id            AS "chunkId",
           c.document_id   AS "documentId",
           d.filename      AS "filename",
           c.ordinal       AS "ordinal",
           c.page          AS "page",
           c.line_start    AS "lineStart",
           c.line_end      AS "lineEnd",
           c.text          AS "text"
      FROM document_chunks c
      JOIN documents d          ON d.id = c.document_id
      JOIN document_versions v  ON v.id = c.version_id
     CROSS JOIN anfrage a
     WHERE d.user_id = ${userId}
       AND d.deleted_at IS NULL
       AND d.active_version_id = c.version_id
       AND v.status = 'ready'
       AND c.document_id = ANY(string_to_array(${idListe}, ',')::uuid[])
       AND (c.search_de @@ a.de OR c.search_en @@ a.en)
     ORDER BY GREATEST(
                ts_rank(c.search_de, a.de),
                ts_rank(c.search_en, a.en)
              ) DESC,
              c.id
     LIMIT ${KANDIDATEN}
  `);

  return ergebnis.rows;
}

/**
 * Reciprocal Rank Fusion: Jede Liste stimmt mit `1 / (k + Platz)` ab.
 *
 * Der Vorteil gegenüber einer Gewichtung der Rohwerte: Kosinus-Abstand und
 * `ts_rank` sind nicht vergleichbar — der eine liegt zwischen 0 und 2, der
 * andere ist unbeschränkt. Über den Platz in der jeweiligen Liste sind sie es.
 */
export function fusionieren(listen: RohTreffer[][], namen: string[]): Treffer[] {
  const punkte = new Map<string, number>();
  const quellen = new Map<string, string[]>();
  const treffer = new Map<string, RohTreffer>();

  for (const [i, liste] of listen.entries()) {
    for (const [platz, zeile] of liste.entries()) {
      const id = zeile.chunkId;
      punkte.set(id, (punkte.get(id) ?? 0) + 1 / (RRF_K + platz + 1));
      quellen.set(id, [...(quellen.get(id) ?? []), namen[i] ?? String(i)]);
      if (!treffer.has(id)) treffer.set(id, zeile);
    }
  }

  return [...punkte.entries()]
    .map(([id, wert]) => {
      const zeile = treffer.get(id);
      if (!zeile) throw new Error(`Treffer ${id} fehlt`);
      return { ...zeile, punkte: wert, quellen: quellen.get(id) ?? [] };
    })
    .sort((a, b) => b.punkte - a.punkte || a.chunkId.localeCompare(b.chunkId));
}

/**
 * Sucht in den ausgewählten Dokumenten.
 *
 * `documentIds` ist ein **Wunsch des Clients, keine Berechtigung**: Die
 * Abfragen filtern zusätzlich auf den Nutzer. Ein fremdes Dokument in der
 * Liste liefert darum nichts, statt Fremdes preiszugeben.
 */
export async function suchen(
  userId: string,
  documentIds: string[],
  frage: string,
  frageVektor: number[],
): Promise<Treffer[]> {
  if (documentIds.length === 0) return [];

  const [sem, lex] = await Promise.all([
    semantisch(userId, documentIds, frageVektor),
    volltext(userId, documentIds, frage),
  ]);

  return fusionieren([sem, lex], ['semantisch', 'volltext']);
}
