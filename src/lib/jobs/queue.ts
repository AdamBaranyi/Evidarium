import { PgBoss } from 'pg-boss';
import { env } from '@/lib/config/env';

/*
 * Die Jobqueue liegt in PostgreSQL, nicht im Prozess.
 *
 * Eine Warteschlange im Arbeitsspeicher geht bei jedem Neustart und jedem
 * Deploy verloren — Dokumente hängen dann für immer in «wird verarbeitet»,
 * ohne dass irgendwo ein Fehler auftaucht. pg-boss legt seine eigenen
 * Tabellen im Schema `pgboss` an und wandert selbst durch seine Migrationen.
 *
 * Gewählt: pg-boss 12.30.0 (MIT). Begründung in docs/ENTSCHEIDE.md, E11.
 */
export const QUEUE_DOKUMENT_EINLESEN = 'dokument-einlesen';

/*
 * Wiederholungen: höchstens drei, mit exponentiellem Backoff und Jitter.
 * Vorübergehende Fehler (Datei kurz nicht lesbar, Datenbank überlastet)
 * erledigen sich damit von selbst; ein dauerhafter Fehler — ein PDF ohne
 * Textschicht etwa — wird im Handler ausdrücklich als endgültig behandelt
 * und gar nicht erst wiederholt.
 */
const WIEDERHOLUNGEN = {
  retryLimit: 3,
  retryDelay: 5,
  retryBackoff: true,
  retryDelayMax: 300,
  expireInSeconds: 600,
} as const;

let boss: PgBoss | null = null;

/**
 * Eine Instanz je Prozess. Web und Worker haben jeweils ihre eigene: Der Web-
 * Prozess schickt nur Jobs los, der Worker arbeitet sie ab.
 */
export async function queue(): Promise<PgBoss> {
  if (boss) return boss;

  const neu = new PgBoss({ connectionString: env.DATABASE_URL_OWNER ?? env.DATABASE_URL });
  neu.on('error', (fehler: Error) => {
    console.error('[queue] Fehler', fehler);
  });
  await neu.start();
  await neu.createQueue(QUEUE_DOKUMENT_EINLESEN, WIEDERHOLUNGEN);
  boss = neu;
  return neu;
}

export async function queueStoppen(): Promise<void> {
  if (!boss) return;
  await boss.stop({ graceful: true });
  boss = null;
}

export type EinlesenAuftrag = {
  documentId: string;
  versionId: string;
};

/**
 * Reiht ein Dokument zum Einlesen ein.
 *
 * Der Schlüssel aus Dokument und Version macht den Auftrag eindeutig: Ein
 * doppelter Klick auf «Neu verarbeiten» erzeugt keinen zweiten Lauf.
 */
export async function einlesenBeauftragen(auftrag: EinlesenAuftrag): Promise<string | null> {
  const b = await queue();
  return b.send(QUEUE_DOKUMENT_EINLESEN, auftrag, {
    singletonKey: `${auftrag.documentId}:${auftrag.versionId}`,
  });
}
