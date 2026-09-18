/*
 * Ein Zustand wird dem Nutzer immer als Satz gezeigt, nie als technischer
 * Code. Alle Texte stehen hier an einer Stelle, damit dieselbe Lage nicht an
 * zwei Orten verschieden heisst.
 */
export const STATUS_TEXT: Record<string, string> = {
  pending: 'Wartet auf Verarbeitung',
  extracting: 'Text wird gelesen',
  chunking: 'Wird in Abschnitte geteilt',
  embedding: 'Wird durchsuchbar gemacht',
  ready: 'Bereit',
  failed: 'Nicht verarbeitbar',
};

/*
 * Fehlermeldungen sagen, was zu tun ist. «pdf_ohne_textschicht» ist die
 * wichtigste: Ein Scan sieht für den Nutzer aus wie jedes andere PDF, und
 * ohne Erklärung wirkt die Ablehnung willkürlich.
 */
export const FEHLER_TEXT: Record<string, string> = {
  pdf_ohne_textschicht:
    'Dieses PDF enthält keinen ausreichend lesbaren Text. Verwende eine PDF-Datei mit Textschicht oder eine Textdatei.',
  pdf_zu_viele_seiten: 'Dieses PDF hat mehr Seiten, als zurzeit verarbeitet werden.',
  pdf_unlesbar:
    'Diese PDF-Datei lässt sich nicht öffnen. Möglicherweise ist sie beschädigt oder verschlüsselt.',
  zu_viele_zeichen: 'Dieses Dokument enthält mehr Text, als zurzeit verarbeitet wird.',
  leer: 'In dieser Datei wurde kein Text gefunden.',
  typ_nicht_unterstuetzt: 'Dieses Format wird nicht unterstützt.',
  dokument_weg: 'Das Dokument wurde während der Verarbeitung gelöscht.',
  version_weg: 'Diese Verarbeitung ist nicht mehr gültig.',
  unerwartet: 'Beim Verarbeiten ist ein unerwarteter Fehler aufgetreten.',
};

export function statusText(status: string | null): string {
  if (status === null) return 'Unbekannt';
  return STATUS_TEXT[status] ?? status;
}

export function fehlerText(code: string | null): string | null {
  if (code === null) return null;
  return FEHLER_TEXT[code] ?? 'Beim Verarbeiten ist ein Fehler aufgetreten.';
}

export function groesseText(bytes: number): string {
  if (bytes < 1024) return `${bytes} Byte`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KiB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
}

/**
 * Die Dateiart in Worten.
 *
 * Nicht `kind.toUpperCase()`: «MARKDOWN» in Versalien ist eine Schablone, und
 * «TEXT» sagt weniger als «Textdatei».
 */
export function artText(kind: string): string {
  const texte: Record<string, string> = {
    pdf: 'PDF',
    text: 'Textdatei',
    markdown: 'Markdown',
  };
  return texte[kind] ?? kind;
}
