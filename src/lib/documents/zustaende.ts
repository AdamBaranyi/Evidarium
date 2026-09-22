import { texte } from '@/lib/i18n/texte';
import { sprachTag, type Sprache } from '@/lib/i18n/sprachen';

/*
 * Ein Zustand wird dem Nutzer immer als Satz gezeigt, nie als technischer
 * Code. Alle Texte stehen hier an einer Stelle, damit dieselbe Lage nicht an
 * zwei Orten verschieden heisst — und das in vier Sprachen.
 *
 * Fehlermeldungen sagen, was zu tun ist. «pdf_ohne_textschicht» ist die
 * wichtigste: Ein Scan sieht für den Nutzer aus wie jedes andere PDF, und
 * ohne Erklärung wirkt die Ablehnung willkürlich.
 */
const ZUSTAND = texte({
  de: {
    status: {
      pending: 'Wartet auf Verarbeitung',
      extracting: 'Text wird gelesen',
      chunking: 'Wird in Abschnitte geteilt',
      embedding: 'Wird durchsuchbar gemacht',
      ready: 'Bereit',
      failed: 'Nicht verarbeitbar',
    },
    unbekannt: 'Unbekannt',
    fehler: {
      pdf_ohne_textschicht:
        'Dieses PDF enthält keinen ausreichend lesbaren Text. Verwende eine PDF-Datei mit Textschicht oder eine Textdatei.',
      pdf_zu_viele_seiten: 'Dieses PDF hat mehr Seiten, als zurzeit verarbeitet werden.',
      pdf_unlesbar:
        'Diese PDF-Datei lässt sich nicht öffnen. Möglicherweise ist sie beschädigt oder verschlüsselt.',
      zu_viele_zeichen: 'Dieses Dokument enthält mehr Text, als zurzeit verarbeitet wird.',
      leer: 'In dieser Datei wurde kein Text gefunden.',
      typ_nicht_unterstuetzt: 'Dieses Format wird nicht unterstützt.',
      demo_zu_viele_seiten:
        'In der Demo sind höchstens 10 Seiten je Datei möglich. Melde dich an, um grössere Dokumente zu laden.',
      dokument_weg: 'Das Dokument wurde während der Verarbeitung gelöscht.',
      version_weg: 'Diese Verarbeitung ist nicht mehr gültig.',
      unerwartet: 'Beim Verarbeiten ist ein unerwarteter Fehler aufgetreten.',
    },
    fehlerAllgemein: 'Beim Verarbeiten ist ein Fehler aufgetreten.',
    art: { pdf: 'PDF', text: 'Textdatei', markdown: 'Markdown' },
    byte: 'Byte',
  },
  fr: {
    status: {
      pending: 'En attente de traitement',
      extracting: 'Lecture du texte',
      chunking: 'Découpage en passages',
      embedding: 'Indexation pour la recherche',
      ready: 'Prêt',
      failed: 'Impossible à traiter',
    },
    unbekannt: 'Inconnu',
    fehler: {
      pdf_ohne_textschicht:
        'Ce PDF ne contient pas suffisamment de texte lisible. Utilisez un PDF avec couche de texte ou un fichier texte.',
      pdf_zu_viele_seiten: 'Ce PDF a plus de pages que ce qui est traité actuellement.',
      pdf_unlesbar:
        'Ce fichier PDF ne peut pas être ouvert. Il est peut-être endommagé ou chiffré.',
      zu_viele_zeichen: 'Ce document contient plus de texte que ce qui est traité actuellement.',
      leer: 'Aucun texte n’a été trouvé dans ce fichier.',
      typ_nicht_unterstuetzt: 'Ce format n’est pas pris en charge.',
      demo_zu_viele_seiten:
        'Dans la démo, 10 pages par fichier au plus sont possibles. Connectez-vous pour charger des documents plus grands.',
      dokument_weg: 'Le document a été supprimé pendant le traitement.',
      version_weg: 'Ce traitement n’est plus valable.',
      unerwartet: 'Une erreur inattendue s’est produite lors du traitement.',
    },
    fehlerAllgemein: 'Une erreur s’est produite lors du traitement.',
    art: { pdf: 'PDF', text: 'Fichier texte', markdown: 'Markdown' },
    byte: 'octets',
  },
  it: {
    status: {
      pending: 'In attesa di elaborazione',
      extracting: 'Lettura del testo',
      chunking: 'Suddivisione in passaggi',
      embedding: 'Indicizzazione per la ricerca',
      ready: 'Pronto',
      failed: 'Non elaborabile',
    },
    unbekannt: 'Sconosciuto',
    fehler: {
      pdf_ohne_textschicht:
        'Questo PDF non contiene abbastanza testo leggibile. Usi un PDF con livello di testo o un file di testo.',
      pdf_zu_viele_seiten: 'Questo PDF ha più pagine di quante ne vengano elaborate al momento.',
      pdf_unlesbar: 'Questo file PDF non si apre. Forse è danneggiato o cifrato.',
      zu_viele_zeichen:
        'Questo documento contiene più testo di quanto ne venga elaborato al momento.',
      leer: 'In questo file non è stato trovato alcun testo.',
      typ_nicht_unterstuetzt: 'Questo formato non è supportato.',
      demo_zu_viele_seiten:
        'Nella demo sono possibili al massimo 10 pagine per file. Acceda per caricare documenti più grandi.',
      dokument_weg: 'Il documento è stato eliminato durante l’elaborazione.',
      version_weg: 'Questa elaborazione non è più valida.',
      unerwartet: 'Durante l’elaborazione si è verificato un errore imprevisto.',
    },
    fehlerAllgemein: 'Durante l’elaborazione si è verificato un errore.',
    art: { pdf: 'PDF', text: 'File di testo', markdown: 'Markdown' },
    byte: 'byte',
  },
  en: {
    status: {
      pending: 'Waiting to be processed',
      extracting: 'Reading the text',
      chunking: 'Splitting into passages',
      embedding: 'Making it searchable',
      ready: 'Ready',
      failed: 'Cannot be processed',
    },
    unbekannt: 'Unknown',
    fehler: {
      pdf_ohne_textschicht:
        'This PDF does not contain enough readable text. Use a PDF with a text layer or a text file.',
      pdf_zu_viele_seiten: 'This PDF has more pages than are currently processed.',
      pdf_unlesbar: 'This PDF file cannot be opened. It may be damaged or encrypted.',
      zu_viele_zeichen: 'This document contains more text than is currently processed.',
      leer: 'No text was found in this file.',
      typ_nicht_unterstuetzt: 'This format is not supported.',
      demo_zu_viele_seiten:
        'The demo allows at most 10 pages per file. Sign in to load larger documents.',
      dokument_weg: 'The document was deleted while being processed.',
      version_weg: 'This processing is no longer valid.',
      unerwartet: 'An unexpected error occurred while processing.',
    },
    fehlerAllgemein: 'An error occurred while processing.',
    art: { pdf: 'PDF', text: 'Text file', markdown: 'Markdown' },
    byte: 'bytes',
  },
});

/** Noch in der Verarbeitung — die Seite lädt dann selbst nach. */
export function inArbeit(status: string | null): boolean {
  return status !== null && status !== 'ready' && status !== 'failed';
}

export function statusText(status: string | null, sprache: Sprache): string {
  const t = ZUSTAND[sprache];
  if (status === null) return t.unbekannt;
  return (t.status as Record<string, string>)[status] ?? status;
}

export function fehlerText(code: string | null, sprache: Sprache): string | null {
  if (code === null) return null;
  const t = ZUSTAND[sprache];
  return (t.fehler as Record<string, string>)[code] ?? t.fehlerAllgemein;
}

export function groesseText(bytes: number, sprache: Sprache): string {
  const tag = sprachTag(sprache);
  if (bytes < 1024) return `${bytes.toLocaleString(tag)} ${ZUSTAND[sprache].byte}`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024).toLocaleString(tag)} KiB`;
  const mib = (bytes / 1024 / 1024).toLocaleString(tag, { maximumFractionDigits: 1 });
  return `${mib} MiB`;
}

/**
 * Die Dateiart in Worten.
 *
 * Nicht `kind.toUpperCase()`: «MARKDOWN» in Versalien ist eine Schablone, und
 * «TEXT» sagt weniger als «Textdatei».
 */
export function artText(kind: string, sprache: Sprache): string {
  return (ZUSTAND[sprache].art as Record<string, string>)[kind] ?? kind;
}
