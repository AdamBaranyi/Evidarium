/*
 * Grenzen, serverseitig durchgesetzt und an einer Stelle definiert.
 *
 * Konfigurierbar über Umgebungsvariablen wäre möglich; solange die Werte
 * nirgends abweichen, ist eine Datei ehrlicher als eine Einstellung, die
 * niemand je ändert.
 */
export const GRENZEN = {
  maxBytes: 10 * 1024 * 1024, // 10 MiB
  maxSeiten: 100,
  maxZeichen: 300_000,
  maxDokumenteJeNutzer: 50,
} as const;

/*
 * Stehen bei jeder Dokumentversion mit in der Zeile. Ändert sich die
 * Extraktion oder die Zerlegung, sind ältere Versionen nicht mehr
 * vergleichbar — ohne diese Angabe merkt das später niemand.
 */
export const PARSER_VERSION = 'unpdf-1.8.1';
export const CHUNKER_VERSION = 'absatz-v1';
