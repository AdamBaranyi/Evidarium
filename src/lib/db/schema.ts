import { sql, type SQL } from 'drizzle-orm';
import {
  check,
  customType,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from 'drizzle-orm/pg-core';

/**
 * Dimension des Embedding-Modells. Steht hier, weil die Spaltenbreite davon
 * abhängt: Ein Modellwechsel mit anderer Dimension erzwingt eine Migration,
 * und das soll auffallen, statt still schiefzugehen.
 *
 * 384 = intfloat/multilingual-e5-small. Siehe docs/ENTSCHEIDE.md, E14.
 */
export const EMBEDDING_DIMENSIONEN = 384;

/**
 * PostgreSQL kennt keinen Drizzle-Typ für `tsvector`. Der eigene Typ macht
 * die Spalte im Schema sichtbar, statt sie als unsichtbare Handarbeit in
 * einer Migration zu verstecken.
 */
const tsvector = customType<{ data: string; driverData: string }>({
  dataType: () => 'tsvector',
});

/*
 * CHECK statt nativer Enums: Wertemengen wachsen, und ein ALTER COLUMN TYPE
 * auf einer befüllten Spalte bleibt so erspart. Die Zod-Enums in der
 * Anwendung halten dieselben Mengen — sonst gibt ungültige Eingabe einen
 * Datenbankfehler statt einer verständlichen Meldung.
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check('users_status_gueltig', sql`${table.status} IN ('active', 'disabled')`)],
);

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('sessions_user_idx').on(table.userId)],
);

export const loginAttempts = pgTable(
  'login_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    originHash: text('origin_hash').notNull(),
    attemptedAt: timestamp('attempted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('login_attempts_lookup_idx').on(table.originHash, table.attemptedAt)],
);

/*
 * Ein Dokument ist die Sache, die der Nutzer sieht. Was daraus gelesen wurde,
 * hängt an einer Version — so bleibt die alte Fassung lesbar, während eine
 * neue entsteht, und ein Modellwechsel wirft nicht alles um.
 */
/*
 * **Projekte: Gruppen von Dokumenten, sonst nichts.** Kein Gesprächsverlauf,
 * keine Anweisungen, keine eigenen Einstellungen — Adams Entscheid vom
 * 22.09.2026, E40. Evidarium speichert keine Fragen; ein Projekt ändert das
 * nicht.
 *
 * Der Name ist je Konto eindeutig, ohne Rücksicht auf Gross- und
 * Kleinschreibung: «Atlas» und «atlas» nebeneinander wären zwei Einträge,
 * die niemand auseinanderhalten kann.
 */
export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('projects_name_laenge', sql`char_length(${table.name}) BETWEEN 1 AND 60`),
    uniqueIndex('projects_name_je_nutzer_idx').on(table.userId, sql`lower(${table.name})`),
  ],
);

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    filename: text('filename').notNull(),
    kind: text('kind').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    // Für die Dublettenerkennung. Bewusst nur innerhalb eines Nutzers eindeutig:
    // sonst verrät ein abgelehnter Upload die Existenz fremder Dokumente.
    contentHash: text('content_hash').notNull(),
    storagePath: text('storage_path').notNull(),
    activeVersionId: uuid('active_version_id'),
    /*
     * Wem in der öffentlichen Demo eine Datei gehört: der Hash des
     * Besuchercookies, nie der Wert selbst. Solche Dateien gehören dem
     * Demo-Konto, sind aber diesem Besuch zugeordnet.
     *
     * **Leerer Text statt `NULL`** für alles andere, und das ist kein
     * Schönheitsfehler: In einem eindeutigen Index gelten zwei `NULL` als
     * verschieden. Die Dublettenerkennung angemeldeter Konten wäre damit
     * wirkungslos — dieselbe Datei liesse sich beliebig oft hochladen.
     * `NULLS NOT DISTINCT` kennt die eingesetzte Drizzle-Fassung nicht.
     */
    besucherHash: text('besucher_hash').notNull().default(''),
    /** Zeitpunkt der automatischen Löschung. Nur bei Demo-Uploads gesetzt. */
    ablaufAm: timestamp('ablauf_am', { withTimezone: true }),
    /*
     * Hash der Herkunft, nur bei Demo-Uploads — für die Grenze je Herkunft
     * und Tag. Verschwindet mit dem Dokument nach 24 Stunden.
     */
    herkunftHash: text('herkunft_hash'),
    /*
     * Höchstens ein Projekt je Dokument, wie ein Ordner. Wird das Projekt
     * gelöscht, bleibt das Dokument und steht danach ohne Projekt da.
     *
     * Dass Dokument und Projekt demselben Konto gehören, prüft die
     * Anwendung an genau einer Stelle (`lib/projekte`), mit Tests. Ein
     * zusammengesetzter Fremdschlüssel könnte das in der Datenbank erzwingen,
     * bräuchte aber `ON DELETE SET NULL (project_id)` — das kennt die
     * eingesetzte Drizzle-Fassung nicht, und `SET NULL` auf beide Spalten
     * scheiterte an `user_id NOT NULL`.
     */
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    check('documents_kind_gueltig', sql`${table.kind} IN ('pdf', 'text', 'markdown')`),
    /*
     * Eindeutig je Konto **und Besuch**: Zwei Besucher dürfen dieselbe Datei
     * hochladen, ohne voneinander zu erfahren. Ein abgelehnter Upload würde
     * sonst die Existenz fremder Dokumente verraten.
     */
    uniqueIndex('documents_hash_je_nutzer_idx').on(
      table.userId,
      table.contentHash,
      table.besucherHash,
    ),
    index('documents_user_idx').on(table.userId, table.createdAt),
    index('documents_besucher_idx').on(table.besucherHash, table.ablaufAm),
    index('documents_herkunft_idx').on(table.herkunftHash, table.createdAt),
    index('documents_projekt_idx').on(table.projectId),
  ],
);

/*
 * Parser- und Chunker-Version stehen mit in der Zeile: Ändert sich die
 * Extraktion, ist eine alte Version nicht mehr vergleichbar, und ohne diese
 * Angabe merkt das später niemand.
 */
export const documentVersions = pgTable(
  'document_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    parserVersion: text('parser_version').notNull(),
    chunkerVersion: text('chunker_version').notNull(),
    status: text('status').notNull().default('pending'),
    errorCode: text('error_code'),
    pageCount: integer('page_count'),
    charCount: integer('char_count'),
    chunkCount: integer('chunk_count'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (table) => [
    check(
      'document_versions_status_gueltig',
      sql`${table.status} IN ('pending', 'extracting', 'chunking', 'embedding', 'ready', 'failed')`,
    ),
    index('document_versions_document_idx').on(table.documentId, table.createdAt),
  ],
);

/*
 * Ein Abschnitt trägt seine Herkunft mit: Seite bei PDF, Zeilenbereich bei
 * Text und Markdown. Ohne diese Angaben gäbe es später keinen anklickbaren
 * Beleg — sie sind der eigentliche Zweck der ganzen Pipeline.
 *
 * Der Vektor kommt an Tag 3 dazu, zusammen mit dem Embedding-Modell.
 */
export const documentChunks = pgTable(
  'document_chunks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    versionId: uuid('version_id')
      .notNull()
      .references(() => documentVersions.id, { onDelete: 'cascade' }),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    ordinal: integer('ordinal').notNull(),
    page: integer('page'),
    lineStart: integer('line_start'),
    lineEnd: integer('line_end'),
    text: text('text').notNull(),
    charCount: integer('char_count').notNull(),

    /*
     * Der Vektor und das Modell, das ihn erzeugt hat, stehen zusammen in der
     * Zeile. Vektoren verschiedener Modelle dürfen nie in derselben Abfrage
     * verglichen werden — ohne diese Spalte merkt das niemand.
     *
     * Null heisst: noch nicht eingebettet.
     */
    embedding: vector('embedding', { dimensions: EMBEDDING_DIMENSIONEN }),
    embeddingModel: text('embedding_model'),

    /*
     * Zwei Volltextspalten statt einer mit Spracherkennung.
     *
     * Die deutsche Konfiguration greift schwach auf englischem Text und
     * umgekehrt; eine automatische Spracherkennung wäre eine weitere
     * Fehlerquelle, und ein falsch erkanntes Dokument verschwände lautlos aus
     * der Suche. Zwei Spalten kosten Speicher und lösen das Problem ganz.
     */
    searchDe: tsvector('search_de').generatedAlwaysAs(
      (): SQL => sql`to_tsvector('german', ${documentChunks.text})`,
    ),
    searchEn: tsvector('search_en').generatedAlwaysAs(
      (): SQL => sql`to_tsvector('english', ${documentChunks.text})`,
    ),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Ein wiederholter Job erzeugt keine doppelten Abschnitte.
    uniqueIndex('document_chunks_version_ordinal_idx').on(table.versionId, table.ordinal),
    index('document_chunks_document_idx').on(table.documentId),

    // Kosinus, weil e5 normalisierte Vektoren liefert.
    index('document_chunks_embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops')),
    index('document_chunks_search_de_idx').using('gin', table.searchDe),
    index('document_chunks_search_en_idx').using('gin', table.searchEn),
  ],
);

/*
 * Jeder bezahlte Aufruf hinterlässt eine Zeile — vor dem Aufruf als
 * Reservierung, danach mit den gemessenen Werten.
 *
 * Die Reservierung ist der Schutz gegen parallele Anfragen: Ohne sie könnten
 * zehn gleichzeitige Fragen den Tagesdeckel gemeinsam überziehen, weil jede
 * einzelne beim Prüfen noch Luft sieht.
 *
 * **Fehlende Messwerte sind keine Nullkosten.** Bricht ein Aufruf nach einer
 * Zeitüberschreitung ab, bleibt die Reservierung stehen und wird als
 * `unklar` markiert, statt gelöscht zu werden.
 */
export const usageEvents = pgTable(
  'usage_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    sessionId: text('session_id'),
    /*
     * Hash der Herkunft, nur für die öffentliche Demo. Die IP selbst wird
     * nie gespeichert — der Hash genügt, um Fragen derselben Quelle zu
     * zählen, und lässt sich nicht zurückrechnen.
     */
    originHash: text('origin_hash'),
    operation: text('operation').notNull(),
    status: text('status').notNull().default('reserviert'),
    modell: text('modell').notNull(),
    eingabeTokens: integer('eingabe_tokens'),
    ausgabeTokens: integer('ausgabe_tokens'),
    /* In Mikro-Dollar, damit nichts an Rundung verlorengeht. */
    kostenMikroUsd: integer('kosten_mikro_usd').notNull(),
    preisstand: text('preisstand').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'usage_events_status_gueltig',
      sql`${table.status} IN ('reserviert', 'abgerechnet', 'unklar')`,
    ),
    check('usage_events_operation_gueltig', sql`${table.operation} IN ('antwort', 'reparatur')`),
    index('usage_events_zeitraum_idx').on(table.createdAt),
    index('usage_events_nutzer_idx').on(table.userId, table.createdAt),
    index('usage_events_sitzung_idx').on(table.sessionId),
    index('usage_events_herkunft_idx').on(table.originHash, table.createdAt),
  ],
);
