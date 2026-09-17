import { extractText, getDocumentProxy } from 'unpdf';
import { GRENZEN } from './grenzen';
import type { Dateityp } from './dateityp';

/**
 * Ein Abschnitt des Dokuments mit seiner Herkunft. Genau diese Angaben
 * machen später den anklickbaren Beleg aus — ohne sie wäre die ganze
 * Pipeline wertlos.
 */
export type Textstelle = {
  /** Bei PDF gesetzt, sonst null. */
  page: number | null;
  /** Bei Text und Markdown gesetzt, sonst null. 1-basiert, einschliesslich. */
  lineStart: number | null;
  lineEnd: number | null;
  text: string;
};

export type Extraktion = {
  stellen: Textstelle[];
  pageCount: number | null;
  charCount: number;
};

/** Fehler mit einem Code, den die Oberfläche in eine Meldung übersetzt. */
export class ExtraktionsFehler extends Error {
  constructor(readonly code: ExtraktionsFehlerCode) {
    super(code);
    this.name = 'ExtraktionsFehler';
  }
}

export type ExtraktionsFehlerCode =
  'pdf_ohne_textschicht' | 'pdf_zu_viele_seiten' | 'pdf_unlesbar' | 'zu_viele_zeichen' | 'leer';

/*
 * Ein PDF ohne Textschicht ist ein Scan. Ohne OCR gibt es daraus nichts zu
 * holen — das gehört sofort und verständlich gemeldet, nicht als ewiger
 * Ladezustand oder als stilles OCR-Versprechen.
 *
 * Schwelle: Steht über alle Seiten zusammen weniger als das, ist es kein
 * Textdokument. Ein einzelnes Deckblatt ohne Text bleibt damit erlaubt.
 */
const MINDESTZEICHEN_PDF = 40;

async function ausPdf(bytes: Uint8Array): Promise<Extraktion> {
  let seiten: string[];
  let totalPages: number;

  try {
    /*
     * pdf.js übernimmt den übergebenen Puffer und koppelt ihn ab: Nach dem
     * Aufruf ist `bytes.byteLength` null. Ein zweiter Aufruf mit demselben
     * Array meldet dann «beschädigt» — eine Falschaussage über eine
     * einwandfreie Datei. Darum bekommt pdf.js eine Kopie, und der Aufrufer
     * behält seine Bytes.
     */
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const ergebnis = await extractText(pdf, { mergePages: false });
    seiten = ergebnis.text;
    totalPages = ergebnis.totalPages;
  } catch {
    // Verschlüsselt, beschädigt oder ein Format, das pdf.js nicht öffnet.
    throw new ExtraktionsFehler('pdf_unlesbar');
  }

  if (totalPages > GRENZEN.maxSeiten) throw new ExtraktionsFehler('pdf_zu_viele_seiten');

  const stellen: Textstelle[] = [];
  let charCount = 0;

  for (const [index, roh] of seiten.entries()) {
    const text = roh.replace(/\s+/g, ' ').trim();
    if (text === '') continue;
    charCount += text.length;
    if (charCount > GRENZEN.maxZeichen) throw new ExtraktionsFehler('zu_viele_zeichen');
    stellen.push({ page: index + 1, lineStart: null, lineEnd: null, text });
  }

  if (charCount < MINDESTZEICHEN_PDF) throw new ExtraktionsFehler('pdf_ohne_textschicht');

  return { stellen, pageCount: totalPages, charCount };
}

/*
 * Text und Markdown werden an Leerzeilen getrennt. Der Zeilenbereich wird
 * dabei mitgezählt, damit ein Beleg später auf «Zeile 40 bis 48» zeigen kann.
 */
function ausText(bytes: Uint8Array): Extraktion {
  const inhalt = new TextDecoder('utf-8').decode(bytes);
  const zeilen = inhalt.split(/\r?\n/);

  const stellen: Textstelle[] = [];
  let charCount = 0;
  let puffer: string[] = [];
  let beginn = 1;

  const abschliessen = (endeZeile: number) => {
    const text = puffer.join('\n').trim();
    puffer = [];
    if (text === '') return;
    charCount += text.length;
    stellen.push({ page: null, lineStart: beginn, lineEnd: endeZeile, text });
  };

  for (const [index, zeile] of zeilen.entries()) {
    const nummer = index + 1;
    if (zeile.trim() === '') {
      abschliessen(nummer - 1);
      beginn = nummer + 1;
      continue;
    }
    if (puffer.length === 0) beginn = nummer;
    puffer.push(zeile);
  }
  abschliessen(zeilen.length);

  if (charCount > GRENZEN.maxZeichen) throw new ExtraktionsFehler('zu_viele_zeichen');
  if (charCount === 0) throw new ExtraktionsFehler('leer');

  return { stellen, pageCount: null, charCount };
}

export async function extrahieren(bytes: Uint8Array, typ: Dateityp): Promise<Extraktion> {
  return typ === 'pdf' ? ausPdf(bytes) : ausText(bytes);
}
