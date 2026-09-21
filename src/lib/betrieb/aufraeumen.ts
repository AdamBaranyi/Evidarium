import { and, isNotNull, lt, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { loginAttempts, sessions, usageEvents } from '@/lib/db/schema';

/*
 * Personenbezogenes kurz halten.
 *
 * Die eigene Regel in `wissen-sicherheit` lautet: IP nur als Hash, **kurz
 * gespeichert**. Bis zum 21.09.2026 blieb der Hash im Ausgabenprotokoll für
 * immer liegen — gebraucht wird er aber nur für die Grenze je Herkunft und
 * Tag. Befund S7 im Prüfbericht.
 *
 * Was bleibt, ist das Protokoll selbst: Zeitpunkt, Modell, Token, Kosten. Das
 * braucht es für die Abrechnung, und es sagt nichts mehr über eine Person.
 *
 * Dazu, was ohnehin nie wieder gebraucht wird: Anmeldeversuche älter als ein
 * Tag (gezählt werden nur die letzten 15 Minuten) und abgelaufene Sitzungen.
 */

const EIN_TAG = 24 * 60 * 60 * 1000;

export type Aufgeraeumt = { herkunft: number; versuche: number; sitzungen: number };

export async function personendatenKuerzen(jetzt: Date = new Date()): Promise<Aufgeraeumt> {
  const vorEinemTag = new Date(jetzt.getTime() - EIN_TAG);

  const herkunft = await db
    .update(usageEvents)
    .set({ originHash: null })
    .where(and(isNotNull(usageEvents.originHash), lt(usageEvents.createdAt, vorEinemTag)))
    .returning({ id: usageEvents.id });

  const versuche = await db
    .delete(loginAttempts)
    .where(lt(loginAttempts.attemptedAt, vorEinemTag))
    .returning({ id: sql<number>`1` });

  const sitzungen = await db
    .delete(sessions)
    .where(lt(sessions.expiresAt, jetzt))
    .returning({ id: sessions.id });

  return {
    herkunft: herkunft.length,
    versuche: versuche.length,
    sitzungen: sitzungen.length,
  };
}
