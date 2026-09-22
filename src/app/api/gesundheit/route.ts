import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/*
 * Für den Healthcheck des Containers (`infra/compose.prod.yml`) und für das
 * Deploy-Skript, das nach dem Start darauf wartet: Läuft der Webprozess, und
 * antwortet die Datenbank?
 *
 * Die Route ist öffentlich erreichbar. Darum verrät die Antwort nicht mehr
 * als ja oder nein — keine Fassung, keinen Fehlertext, keine Namen.
 */
const KOPF = { 'Cache-Control': 'no-store' };

export async function GET(): Promise<Response> {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true }, { headers: KOPF });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: KOPF });
  }
}
