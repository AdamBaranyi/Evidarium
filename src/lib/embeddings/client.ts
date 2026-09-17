import { z } from 'zod';
import { env } from '@/lib/config/env';
import { EMBEDDING_DIMENSIONEN } from './modell';

/*
 * Die Seite des Web-Prozesses: Er fragt den Worker nach dem Vektor einer
 * Frage und hält selbst **kein** Modell (docs/ENTSCHEIDE.md, E4).
 */

const Antwort = z.object({ vektoren: z.array(z.array(z.number())) });

export class EmbeddingFehler extends Error {
  constructor(grund: string) {
    super(grund);
    this.name = 'EmbeddingFehler';
  }
}

/*
 * Kurzes Zeitlimit: Einbetten dauert Millisekunden. Antwortet der Worker
 * nicht in fünf Sekunden, läuft er nicht oder hängt — dann soll die Frage
 * mit einer klaren Meldung scheitern, statt den Nutzer warten zu lassen.
 */
const ZEITLIMIT_MS = 5000;

export async function frageEinbetten(frage: string): Promise<number[]> {
  const abbruch = AbortSignal.timeout(ZEITLIMIT_MS);

  let antwort: Response;
  try {
    antwort = await fetch(`${env.WORKER_INTERN_URL}/einbetten`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ texte: [frage] }),
      signal: abbruch,
    });
  } catch {
    throw new EmbeddingFehler('Worker nicht erreichbar');
  }

  if (!antwort.ok) throw new EmbeddingFehler(`Worker antwortet mit ${antwort.status}`);

  const daten = Antwort.safeParse(await antwort.json());
  const vektor = daten.success ? daten.data.vektoren[0] : undefined;

  if (!vektor) throw new EmbeddingFehler('Worker liefert keinen Vektor');
  if (vektor.length !== EMBEDDING_DIMENSIONEN) {
    // Würde sonst in der Datenbank als Typfehler auftauchen, weit weg von
    // der Ursache.
    throw new EmbeddingFehler(
      `Worker liefert ${vektor.length} Dimensionen, erwartet ${EMBEDDING_DIMENSIONEN}`,
    );
  }

  return vektor;
}
