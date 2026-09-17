/*
 * Der Typ wird am Inhalt bestimmt, nie am Dateinamen und nie am vom Browser
 * behaupteten MIME-Typ — beides kann der Absender frei setzen.
 *
 * Drei Formate, darum keine Bibliothek: Die Prüfung ist kurz genug, um sie zu
 * lesen, und eine Abhängigkeit weniger ist eine Angriffsfläche weniger.
 */
export type Dateityp = 'pdf' | 'text' | 'markdown';

/** Jede PDF-Datei beginnt mit den Bytes für `%PDF-`. */
function istPdf(bytes: Uint8Array): boolean {
  const kopf = [0x25, 0x50, 0x44, 0x46, 0x2d];
  return kopf.every((byte, i) => bytes[i] === byte);
}

/*
 * Steuerzeichen, die in einer echten Textdatei vorkommen dürfen:
 * Tabulator, Zeilenumbruch, Wagenrücklauf und Seitenvorschub. Der
 * Seitenvorschub ist der klassische Seitentrenner in Textdateien — wer ihn
 * ablehnt, lehnt gültige Dokumente ab.
 */
const ERLAUBTE_STEUERZEICHEN = new Set([0x09, 0x0a, 0x0c, 0x0d]);

/**
 * Gültiges UTF-8 ohne Steuerzeichen, die in Text nichts zu suchen haben.
 * Ein Fund unterhalb von 0x20 ausserhalb der erlaubten Menge heisst: Das ist
 * eine Binärdatei mit einer harmlosen Endung.
 */
function istTextbar(bytes: Uint8Array): boolean {
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return false;
  }
  for (const zeichen of text) {
    const code = zeichen.codePointAt(0) ?? 0;
    if (code >= 0x20 || ERLAUBTE_STEUERZEICHEN.has(code)) continue;
    return false;
  }
  return true;
}

/**
 * Bestimmt den Typ aus dem Inhalt. `null` heisst: nicht unterstützt.
 *
 * Markdown wird nicht am Inhalt erkannt — es *ist* Text. Der Dateiname
 * entscheidet hier allein über die Anzeige, nicht über die Sicherheit:
 * Beide Zweige werden danach gleich behandelt.
 */
export function erkenneTyp(bytes: Uint8Array, dateiname: string): Dateityp | null {
  if (istPdf(bytes)) return 'pdf';
  if (!istTextbar(bytes)) return null;
  return /\.(md|markdown)$/i.test(dateiname) ? 'markdown' : 'text';
}
