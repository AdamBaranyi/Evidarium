/*
 * Angaben zum Embedding-Modell. Diese Datei lädt **kein** Modell — sie wird
 * von beiden Prozessen gelesen, und nur der Worker darf eine Instanz halten
 * (docs/ENTSCHEIDE.md, E4).
 */

/**
 * `intfloat/multilingual-e5-small`, die Originalquelle, nicht eine Kopie.
 * MIT, 384 Dimensionen, ONNX vorhanden — ohne ONNX läuft ein Modell nicht in
 * transformers.js, egal wie gut es sonst ist.
 */
export const EMBEDDING_MODELL = 'intfloat/multilingual-e5-small';

/** Muss mit `EMBEDDING_DIMENSIONEN` im Schema übereinstimmen. */
export const EMBEDDING_DIMENSIONEN = 384;

/**
 * Die Indexversion ändert sich, sobald Modell, Dimension oder Zerlegung
 * wechseln. Vektoren verschiedener Versionen dürfen nie in derselben Abfrage
 * verglichen werden.
 */
export const INDEX_VERSION = 'e5-small-v1';

/*
 * E5-Modelle sind auf zwei Präfixe trainiert: `query:` für die Frage,
 * `passage:` für den Dokumentabschnitt. Ohne sie sinkt die Trefferqualität
 * spürbar, und zwar lautlos — es gibt keine Fehlermeldung, nur schlechtere
 * Ergebnisse. Darum stehen sie hier und nicht verstreut im Aufrufcode.
 */
export type Textart = 'frage' | 'abschnitt';

export function mitPraefix(text: string, art: Textart): string {
  return art === 'frage' ? `query: ${text}` : `passage: ${text}`;
}

/**
 * Formatiert einen Vektor für PostgreSQL. pgvector erwartet `[1,2,3]`,
 * nicht das JSON-Array-Format mit Leerzeichen.
 */
export function alsVektorLiteral(vektor: number[]): string {
  return `[${vektor.join(',')}]`;
}
