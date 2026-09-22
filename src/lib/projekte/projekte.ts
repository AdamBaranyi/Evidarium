import { and, count, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { documents, projects } from '@/lib/db/schema';
import { PROJEKT_GRENZEN, type ProjektFehler, type ProjektZeile } from './grenzen';

/*
 * Projekte — Gruppen von Dokumenten (E40).
 *
 * **Jede Funktion nimmt die Nutzer-ID und filtert danach**, wie überall in
 * der Anwendung. Dass ein Dokument nur in ein Projekt desselben Kontos kommt,
 * wird hier geprüft und nirgends sonst; der Fremdschlüssel allein sähe es
 * nicht (Begründung im Schema).
 *
 * Fremde oder unbekannte Projekte heissen «nicht gefunden», nie «verboten»:
 * Ein Unterschied in der Antwort verriete, dass es die ID gibt.
 */

export { PROJEKT_GRENZEN, type ProjektFehler, type ProjektZeile } from './grenzen';

export type ProjektErgebnis<T = null> =
  { ok: true; wert: T } | { ok: false; fehler: ProjektFehler };

/**
 * Der Name, wie er gespeichert wird: zusammengesetzte Zeichen vereinheitlicht
 * (ein «ü» vom Mac kommt sonst zerlegt), Leerraum zusammengezogen.
 */
const NAME = z
  .string()
  .transform((wert) => wert.normalize('NFC').replace(/\s+/g, ' ').trim())
  .pipe(
    z.string().min(1, { error: 'leer' }).max(PROJEKT_GRENZEN.maxNameZeichen, { error: 'zu_lang' }),
  );

function nameLesen(roh: unknown): ProjektErgebnis<string> {
  const name = NAME.safeParse(roh);
  if (name.success) return { ok: true, wert: name.data };
  const fehler = name.error.issues[0]?.message === 'zu_lang' ? 'zu_lang' : 'leer';
  return { ok: false, fehler };
}

/** Die Projekte eines Kontos mit der Zahl ihrer Dokumente, nach Namen sortiert. */
export async function projekteListen(userId: string): Promise<ProjektZeile[]> {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      anzahl: sql<number>`count(${documents.id})::int`,
    })
    .from(projects)
    .leftJoin(documents, and(eq(documents.projectId, projects.id), isNull(documents.deletedAt)))
    .where(eq(projects.userId, userId))
    .groupBy(projects.id)
    .orderBy(sql`lower(${projects.name})`);
}

async function nameVergeben(userId: string, name: string, ausser?: string): Promise<boolean> {
  const [treffer] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.userId, userId), sql`lower(${projects.name}) = lower(${name})`))
    .limit(1);
  return treffer !== undefined && treffer.id !== ausser;
}

/** Bei zwei gleichzeitigen Anfragen fängt der eindeutige Index, was die Prüfung verpasst. */
function istDoppelt(fehler: unknown): boolean {
  const code = (e: unknown) => (e as { code?: string } | null)?.code;
  return (
    code(fehler) === '23505' || code((fehler as { cause?: unknown } | null)?.cause) === '23505'
  );
}

export async function projektAnlegen(
  userId: string,
  roh: unknown,
): Promise<ProjektErgebnis<{ id: string }>> {
  const name = nameLesen(roh);
  if (!name.ok) return name;

  const [stand] = await db
    .select({ anzahl: count() })
    .from(projects)
    .where(eq(projects.userId, userId));
  if ((stand?.anzahl ?? 0) >= PROJEKT_GRENZEN.maxJeNutzer) return { ok: false, fehler: 'zu_viele' };
  if (await nameVergeben(userId, name.wert)) return { ok: false, fehler: 'gibt_es_schon' };

  try {
    const [neu] = await db
      .insert(projects)
      .values({ userId, name: name.wert })
      .returning({ id: projects.id });
    if (!neu) return { ok: false, fehler: 'nicht_gefunden' };
    return { ok: true, wert: neu };
  } catch (fehler) {
    if (istDoppelt(fehler)) return { ok: false, fehler: 'gibt_es_schon' };
    throw fehler;
  }
}

export async function projektUmbenennen(
  userId: string,
  projektId: string,
  roh: unknown,
): Promise<ProjektErgebnis> {
  const name = nameLesen(roh);
  if (!name.ok) return name;
  if (await nameVergeben(userId, name.wert, projektId)) {
    return { ok: false, fehler: 'gibt_es_schon' };
  }

  try {
    const geaendert = await db
      .update(projects)
      .set({ name: name.wert })
      .where(and(eq(projects.id, projektId), eq(projects.userId, userId)))
      .returning({ id: projects.id });
    return geaendert.length === 1
      ? { ok: true, wert: null }
      : { ok: false, fehler: 'nicht_gefunden' };
  } catch (fehler) {
    if (istDoppelt(fehler)) return { ok: false, fehler: 'gibt_es_schon' };
    throw fehler;
  }
}

/**
 * Löscht das Projekt, **nicht** seine Dokumente: Sie stehen danach ohne
 * Projekt da (`ON DELETE SET NULL`). Wer Dokumente loswerden will, löscht
 * sie einzeln — mit der Löschkaskade aus E28.
 */
export async function projektLoeschen(userId: string, projektId: string): Promise<ProjektErgebnis> {
  const weg = await db
    .delete(projects)
    .where(and(eq(projects.id, projektId), eq(projects.userId, userId)))
    .returning({ id: projects.id });
  return weg.length === 1 ? { ok: true, wert: null } : { ok: false, fehler: 'nicht_gefunden' };
}

/**
 * Ordnet ein Dokument einem Projekt zu — oder keinem (`null`).
 *
 * Beide müssen dem Konto gehören, und das Dokument darf kein Besucherupload
 * der Demo sein: Die gehören zwar dem Demo-Konto, aber einem Besuch.
 */
export async function dokumentZuordnen(
  userId: string,
  documentId: string,
  projektId: string | null,
): Promise<ProjektErgebnis> {
  if (projektId !== null) {
    const [projekt] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, projektId), eq(projects.userId, userId)))
      .limit(1);
    if (!projekt) return { ok: false, fehler: 'nicht_gefunden' };
  }

  const geaendert = await db
    .update(documents)
    .set({ projectId: projektId })
    .where(
      and(
        eq(documents.id, documentId),
        eq(documents.userId, userId),
        eq(documents.besucherHash, ''),
        isNull(documents.deletedAt),
      ),
    )
    .returning({ id: documents.id });
  return geaendert.length === 1
    ? { ok: true, wert: null }
    : { ok: false, fehler: 'nicht_gefunden' };
}
