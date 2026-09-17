import { env as hfEnv, pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';
import {
  EMBEDDING_DIMENSIONEN,
  EMBEDDING_MODELL,
  mitPraefix,
  type Textart,
} from '@/lib/embeddings/modell';

/*
 * **Die einzige Stelle im Projekt, die ein Modell lädt.**
 *
 * Das Modell wird beim Einlesen *und* bei jeder Frage gebraucht. Lädt es auch
 * der Web-Prozess, liegt es doppelt im Speicher: aus rund 1,4 GB werden 2,8.
 * Auf dem Entwicklungsrechner fällt das nicht auf, auf einem geteilten Server
 * neben anderen Anwendungen schon.
 *
 * Der Web-Prozess fragt darum über den internen Endpunkt in http.ts nach dem
 * Vektor einer Frage. Siehe docs/ENTSCHEIDE.md, E4.
 */

// Keine lokalen Modelldateien suchen; der Cache liegt unter .modelle.
hfEnv.allowLocalModels = false;
hfEnv.cacheDir = './.modelle';

let pipe: FeatureExtractionPipeline | null = null;

/**
 * Lädt das Modell beim ersten Aufruf und protokolliert das **genau einmal**.
 *
 * Erscheint diese Zeile zweimal oder in einem anderen Prozess, ist die
 * Trennung verletzt — das ist der Nachweis für E4, nicht nur ein Logeintrag.
 */
export async function modellBereit(): Promise<FeatureExtractionPipeline> {
  if (pipe) return pipe;

  const start = Date.now();
  pipe = await pipeline('feature-extraction', EMBEDDING_MODELL, { dtype: 'fp32' });
  const rss = Math.round(process.memoryUsage().rss / 1024 / 1024);

  console.log(
    `[embeddings] Modell geladen: ${EMBEDDING_MODELL}, ` +
      `${EMBEDDING_DIMENSIONEN} Dimensionen, ${((Date.now() - start) / 1000).toFixed(1)} s, RSS ${rss} MB`,
  );
  return pipe;
}

/*
 * Stapelgrösse: gross genug, dass sich der Aufruf lohnt, klein genug, dass
 * ein Dokument mit hunderten Abschnitten nicht den Speicher sprengt. Ohne
 * Begrenzung wandert bei einem 100-Seiten-PDF alles auf einmal ins Modell.
 */
const STAPEL = 16;

/**
 * Bettet Texte ein. Normalisiert, damit später Kosinus-Ähnlichkeit gilt.
 */
export async function einbetten(texte: string[], art: Textart): Promise<number[][]> {
  if (texte.length === 0) return [];
  const modell = await modellBereit();

  const vektoren: number[][] = [];
  for (let i = 0; i < texte.length; i += STAPEL) {
    const stapel = texte.slice(i, i + STAPEL).map((t) => mitPraefix(t, art));
    const aus = await modell(stapel, { pooling: 'mean', normalize: true });
    const liste = aus.tolist() as number[][];

    for (const vektor of liste) {
      if (vektor.length !== EMBEDDING_DIMENSIONEN) {
        // Passiert, wenn jemand das Modell wechselt, ohne das Schema
        // anzupassen. Lieber hier hart abbrechen als eine halbe Spalte füllen.
        throw new Error(
          `Modell liefert ${vektor.length} Dimensionen, Schema erwartet ${EMBEDDING_DIMENSIONEN}`,
        );
      }
      vektoren.push(vektor);
    }
  }

  return vektoren;
}
