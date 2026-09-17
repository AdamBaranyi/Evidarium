import { normalisieren } from './belegpruefung';

/*
 * Das geprüfte Zitat **im Abschnitt zeigen**, an der Stelle, an der es steht.
 *
 * Die Belegprüfung hat bereits festgestellt, dass das Zitat dort vorkommt —
 * allerdings nach Normalisierung. Fürs Anzeigen braucht es dieselbe Toleranz
 * noch einmal, diesmal als Suche im Originaltext: Ein Zeilenumbruch im PDF
 * darf die Fundstelle nicht unsichtbar machen.
 *
 * Findet diese Suche nichts, wird **nicht geraten**: Dann erscheint der
 * Abschnitt ohne Markierung. Eine Markierung an der falschen Stelle wäre
 * schlimmer als keine.
 */

/** Was beim Vergleich als gleich gilt — dieselbe Liste wie in `normalisieren`. */
const ZEICHENKLASSEN: Record<string, string> = {
  "'": "['‘’‚′]",
  '"': '["“”„″]',
  '-': '[-‐-―−]',
};

function zeichenMuster(zeichen: string): string {
  const klasse = ZEICHENKLASSEN[zeichen];
  if (klasse) return klasse;
  return zeichen.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function alsMuster(zitat: string): RegExp | null {
  const normal = normalisieren(zitat);
  if (normal === '') return null;

  // Wortweise, mit `\s+` dazwischen: Genau die Stellen, an denen die
  // Extraktion umbricht, sind die Stellen zwischen den Wörtern.
  const woerter = normal.split(' ').map((wort) => [...wort].map(zeichenMuster).join(''));
  return new RegExp(woerter.join('\\s+'), 'u');
}

export type Zitatstelle = { vor: string; treffer: string; nach: string };

/**
 * Zerlegt den Abschnitt in Text vor, im und nach dem Zitat.
 *
 * `null`, wenn sich das Zitat im Text nicht wiederfinden lässt.
 */
export function zitatTeile(text: string, zitat: string): Zitatstelle | null {
  const muster = alsMuster(zitat);
  if (!muster) return null;

  // Auf demselben Stand suchen und schneiden, sonst stimmen die Indizes nicht.
  const grundlage = text.normalize('NFC');
  const treffer = muster.exec(grundlage);
  if (!treffer || treffer.index < 0) return null;

  return {
    vor: grundlage.slice(0, treffer.index),
    treffer: treffer[0],
    nach: grundlage.slice(treffer.index + treffer[0].length),
  };
}
