import { randomBytes, createHash } from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sessions, users } from '@/lib/db/schema';

export const SESSION_COOKIE = 'evidarium_session';
const GUELTIGKEIT_TAGE = 7;

/** 32 Byte Zufall, base64url — ausreichend gegen Raten. */
function neueSitzungsId(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Legt eine Sitzung an. Wird bei jeder Anmeldung neu aufgerufen, auch wenn
 * schon eine besteht: Eine erneuerte ID verhindert Session Fixation.
 */
export async function createSession(userId: string): Promise<{ id: string; expiresAt: Date }> {
  const id = neueSitzungsId();
  const expiresAt = new Date(Date.now() + GUELTIGKEIT_TAGE * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ id, userId, expiresAt });
  return { id, expiresAt };
}

/** Liefert den angemeldeten Nutzer oder `null`. Abgelaufene Sitzungen zählen nicht. */
export async function readSession(id: string | undefined) {
  if (!id) return null;
  const [treffer] = await db
    .select({ userId: users.id, email: users.email, status: users.status })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!treffer || treffer.status !== 'active') return null;
  return treffer;
}

export async function deleteSession(id: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, id));
}

/**
 * Hash der Herkunft für den Rate-Limit-Zähler. Die IP selbst wird nie
 * gespeichert; der Hash reicht, um Versuche derselben Quelle zu zählen.
 */
export function hashOrigin(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}
