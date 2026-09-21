import type { Job } from 'pg-boss';
import { env } from '@/lib/config/env';
import { dokumentEinlesen } from '@/lib/documents/einlesen';
import {
  QUEUE_DEMO_AUFRAEUMEN,
  QUEUE_DOKUMENT_EINLESEN,
  queue,
  queueStoppen,
  type EinlesenAuftrag,
} from '@/lib/jobs/queue';
import { abgelaufeneLoeschen } from '@/lib/demo/besucher-dokumente';
import { personendatenKuerzen } from '@/lib/betrieb/aufraeumen';
import { einbetten, modellBereit } from './embeddings';
import { internenEndpunktStarten } from './http';

/*
 * Eigener Prozess, bewusst nicht im Web-Server.
 *
 * Ein Einlesevorgang dauert Sekunden bis Minuten. Hinge er an einer
 * HTTP-Anfrage, bräche er beim ersten Timeout des Reverse Proxy ab, und ein
 * geschlossener Browser-Tab könnte ihn mitnehmen. Als eigener Prozess
 * überlebt er beides.
 *
 * Start: bun run worker
 */
async function main(): Promise<void> {
  /*
   * Das Modell vor dem ersten Auftrag laden, nicht beim ersten. Sonst wartet
   * die erste Frage des Tages 15 Sekunden auf etwas, das mit ihr nichts zu
   * tun hat.
   */
  await modellBereit();
  internenEndpunktStarten(env.WORKER_INTERN_PORT);

  const boss = await queue();
  console.log('[worker] bereit, wartet auf Aufträge');

  await boss.work<EinlesenAuftrag>(
    QUEUE_DOKUMENT_EINLESEN,
    async ([job]: Job<EinlesenAuftrag>[]) => {
      if (!job) return;
      const { documentId, versionId } = job.data;
      console.log(`[worker] lese ein: ${documentId} (Version ${versionId})`);

      const ergebnis = await dokumentEinlesen(documentId, versionId, einbetten);

      if (ergebnis.ok) {
        console.log(`[worker] fertig: ${documentId}`);
        return;
      }

      if (ergebnis.endgueltig) {
        // Endgültig heisst: Der Job gilt als erledigt. Der Grund steht in der
        // Version und wird dem Nutzer angezeigt — ein erneuter Versuch käme
        // zum selben Ergebnis und würde nur den Fehler verdecken.
        console.log(`[worker] endgültig gescheitert: ${documentId} (${ergebnis.code})`);
        return;
      }

      // Werfen heisst: pg-boss zählt einen Versuch und legt den Job nach
      // Backoff wieder hin.
      throw new Error(`Einlesen fehlgeschlagen: ${ergebnis.code}`);
    },
  );

  /*
   * Abgelaufene Demo-Uploads wegräumen, alle 15 Minuten.
   *
   * Die Zusage lautet «nach 24 Stunden gelöscht». Eine Zusage, die an einem
   * Zeitgeber im Web-Prozess hinge, wäre beim nächsten Neustart weg — der
   * Plan liegt darum in der Datenbank, und ein Neustart holt Versäumtes nach.
   *
   * Der Lauf protokolliert auch die Null: Wer im Log nichts sieht, weiss
   * sonst nicht, ob nichts fällig war oder nichts lief.
   */
  await boss.work(QUEUE_DEMO_AUFRAEUMEN, async () => {
    const weg = await abgelaufeneLoeschen();
    const gekuerzt = await personendatenKuerzen();
    console.log(
      `[worker] aufgeräumt: ${weg} Demo-Dateien, ${gekuerzt.herkunft} Herkunfts-Hashes, ` +
        `${gekuerzt.versuche} Anmeldeversuche, ${gekuerzt.sitzungen} Sitzungen`,
    );
  });

  await boss.schedule(QUEUE_DEMO_AUFRAEUMEN, '*/15 * * * *');
}

/*
 * Geordnetes Herunterfahren: Ein laufender Job wird zu Ende gebracht, statt
 * mitten im Schreiben abzubrechen.
 */
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    console.log(`[worker] ${signal}, fahre herunter`);
    void queueStoppen().then(() => process.exit(0));
  });
}

main().catch((fehler: unknown) => {
  console.error('[worker] Start fehlgeschlagen', fehler);
  process.exit(1);
});
