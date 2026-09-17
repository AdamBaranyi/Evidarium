import { and, eq, gt, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { loginAttempts } from '@/lib/db/schema';

const FENSTER_MINUTEN = 15;
const MAX_VERSUCHE = 5;

/*
 * Nur Fehlversuche zählen (`skipSuccessfulRequests`). Sonst sperrt sich ein
 * Büro mit einer gemeinsamen IP selbst aus, und in der CI teilen sich alle
 * Testläufe eine Adresse.
 *
 * Kein hartes Limit je Konto — das wäre ein Aussperr-Angriff auf fremde
 * Konten. Gezählt wird die Herkunft.
 */
export async function loginErlaubt(originHash: string): Promise<boolean> {
  const seit = new Date(Date.now() - FENSTER_MINUTEN * 60 * 1000);
  const [zeile] = await db
    .select({ anzahl: sql<number>`count(*)::int` })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.originHash, originHash), gt(loginAttempts.attemptedAt, seit)));

  return (zeile?.anzahl ?? 0) < MAX_VERSUCHE;
}

export async function fehlversuchNotieren(originHash: string): Promise<void> {
  await db.insert(loginAttempts).values({ originHash });
}

/** Nach erfolgreicher Anmeldung sind die Fehlversuche dieser Herkunft erledigt. */
export async function fehlversucheLoeschen(originHash: string): Promise<void> {
  await db.delete(loginAttempts).where(eq(loginAttempts.originHash, originHash));
}
