import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { documentVersions, documents, users } from '@/lib/db/schema';
import { dokumentAnlegen } from '@/lib/documents/anlegen';
import { einlesenBeauftragen } from '@/lib/jobs/queue';

/*
 * Lädt den Evaluationskorpus über **denselben Weg wie ein Upload**: anlegen,
 * Job einreihen, auf `ready` warten. Nicht direkt in die Tabellen schreiben.
 *
 * Eine Evaluation, die an der Pipeline vorbei einfügt, prüft nur das Modell.
 * Die Hälfte der Fehler, die einer Antwort schaden, entsteht aber vorher: in
 * der Extraktion, in der Zerlegung, in den Seitenzahlen.
 *
 * Nichts wird gelöscht. Ein zweiter Lauf erkennt die Dokumente am
 * Inhaltshash wieder und verwendet sie weiter; ein **geänderter** Korpus wird
 * neu eingelesen. Die alte Fassung bleibt als Karteileiche beim
 * Evaluationskonto stehen — bei 50 Dokumenten je Nutzer reicht das für gut
 * acht Korpusfassungen, danach ist von Hand aufzuräumen.
 */

const KORPUS = join(import.meta.dirname, 'korpus');
const EVAL_KONTO = 'evaluation@nordstern.test';

export { EVAL_KONTO };

/** Wartezeit, bis der Worker ein Dokument fertig hat. */
const GEDULD_MS = 120_000;
const TAKT_MS = 500;

export type GeladenesDokument = { datei: string; documentId: string };

async function korpusNutzer(konto: string): Promise<string> {
  const [vorhanden] = await db.select().from(users).where(eq(users.email, konto)).limit(1);
  if (vorhanden) return vorhanden.id;

  /*
   * Kein anmeldbares Passwort: Dieses Konto gehört dem Prüflauf, nicht einem
   * Menschen. Der Platzhalter ist kein gültiger Argon2-Hash, die Prüfung
   * scheitert also immer — und niemand muss ein Geheimnis verwalten.
   */
  const [neu] = await db
    .insert(users)
    .values({ email: konto, passwordHash: 'kein-anmeldbares-konto' })
    .returning({ id: users.id });

  if (!neu) throw new Error(`Konto ${konto} konnte nicht angelegt werden`);
  return neu.id;
}

/**
 * Gesucht wird über den **Inhaltshash**, nicht über den Dateinamen.
 *
 * Über den Namen würde ein geänderter Korpus stillschweigend mit der alten
 * Fassung geprüft: Die Datei heisst ja weiterhin gleich. Genau das wäre beim
 * Nachschärfen des Injektionsfalls passiert.
 */
async function dokumentNachHash(userId: string, contentHash: string): Promise<string | null> {
  const [zeile] = await db
    .select({ id: documents.id })
    .from(documents)
    .where(and(eq(documents.userId, userId), eq(documents.contentHash, contentHash)))
    .limit(1);
  return zeile?.id ?? null;
}

async function status(documentId: string): Promise<string | null> {
  const [zeile] = await db
    .select({ status: documentVersions.status })
    .from(documentVersions)
    .where(eq(documentVersions.documentId, documentId))
    .orderBy(desc(documentVersions.createdAt))
    .limit(1);
  return zeile?.status ?? null;
}

async function aufFertigWarten(documentId: string, datei: string): Promise<void> {
  const ende = Date.now() + GEDULD_MS;
  for (;;) {
    const jetzt = await status(documentId);
    if (jetzt === 'ready') return;
    if (jetzt === 'failed') throw new Error(`${datei}: Verarbeitung fehlgeschlagen`);
    if (Date.now() > ende) throw new Error(`${datei}: nach ${GEDULD_MS / 1000} s nicht fertig`);
    await new Promise((weiter) => setTimeout(weiter, TAKT_MS));
  }
}

/**
 * Lädt den Korpus für ein Konto. Dasselbe Verfahren dient der Evaluation
 * und der öffentlichen Demo — ein zweiter Ladeweg wäre eine zweite
 * Fehlerquelle.
 */
export async function korpusLaden(
  konto: string = EVAL_KONTO,
): Promise<{ userId: string; dokumente: GeladenesDokument[] }> {
  const userId = await korpusNutzer(konto);
  const dateien = (await readdir(KORPUS)).filter((name) => !name.startsWith('.')).sort();
  const geladen: GeladenesDokument[] = [];

  for (const datei of dateien) {
    const bytes = new Uint8Array(await readFile(join(KORPUS, datei)));
    const contentHash = createHash('sha256').update(bytes).digest('hex');

    const vorhanden = await dokumentNachHash(userId, contentHash);
    if (vorhanden) {
      await aufFertigWarten(vorhanden, datei);
      geladen.push({ datei, documentId: vorhanden });
      continue;
    }

    const ergebnis = await dokumentAnlegen(userId, datei, bytes);
    if (!ergebnis.ok) throw new Error(`${datei}: ${ergebnis.fehler}`);

    await einlesenBeauftragen({
      documentId: ergebnis.documentId,
      versionId: ergebnis.versionId,
    });
    await aufFertigWarten(ergebnis.documentId, datei);
    geladen.push({ datei, documentId: ergebnis.documentId });
  }

  return { userId, dokumente: geladen };
}
