import { and, asc, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { documentVersions, documents, users } from '@/lib/db/schema';
import { env } from '@/lib/config/env';

/*
 * Der vorbereitete Korpus der öffentlichen Demo.
 *
 * **Die Demo fragt nur diese Dokumente, und der Client sucht sie nicht aus.**
 * Eine Dokumentauswahl aus dem Browser wäre hier eine Einladung: Wer IDs
 * raten darf, probiert fremde. Der Endpunkt setzt die Auswahl selbst.
 *
 * Hochladen kann in der Demo niemand. Das ist die wirksamste Massnahme gegen
 * Missbrauch und kostet nichts an Aussagekraft — vorgeführt wird das
 * Antworten mit Belegen, nicht das Hochladen.
 */

export type DemoDokument = { id: string; filename: string };

/**
 * Einmal je Prozess auflösen. Der Korpus ändert sich nur, wenn jemand das
 * Ladeskript aufruft — dann startet die Anwendung ohnehin neu.
 */
let zwischenspeicher: Promise<DemoKorpus | null> | null = null;

export type DemoKorpus = { userId: string; dokumente: DemoDokument[] };

async function aufloesen(): Promise<DemoKorpus | null> {
  const [konto] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, env.DEMO_KONTO))
    .limit(1);

  if (!konto) return null;

  const dokumente = await db
    .select({ id: documents.id, filename: documents.filename })
    .from(documents)
    .innerJoin(documentVersions, eq(documentVersions.id, documents.activeVersionId))
    .where(
      and(
        eq(documents.userId, konto.id),
        isNull(documents.deletedAt),
        eq(documentVersions.status, 'ready'),
      ),
    )
    .orderBy(asc(documents.filename));

  if (dokumente.length === 0) return null;
  return { userId: konto.id, dokumente };
}

export async function demoKorpus(): Promise<DemoKorpus | null> {
  zwischenspeicher ??= aufloesen();
  const korpus = await zwischenspeicher;
  // Ein leeres Ergebnis nicht festhalten: Wird der Korpus nachträglich
  // geladen, soll die nächste Anfrage ihn finden.
  if (!korpus) zwischenspeicher = null;
  return korpus;
}

/** `true`, wenn die Demo eingeschaltet **und** befüllt ist. */
export async function demoBereit(): Promise<boolean> {
  if (!env.DEMO_AKTIV) return false;
  return (await demoKorpus()) !== null;
}
