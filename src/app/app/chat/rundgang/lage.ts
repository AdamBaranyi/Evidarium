/*
 * Wo die Karte des Rundgangs steht und welcher Ausschnitt hell bleibt —
 * reine Rechnung, ohne DOM, darum mit Tests.
 *
 * Das Vorgehen stammt aus Tallyroom: unter dem Ziel, sonst darüber, sonst
 * rechts daneben; passt nichts, steht die Karte am oberen oder unteren
 * Bildrand, wo sie weniger verdeckt.
 */

export type Kasten = { top: number; left: number; width: number; height: number };
type Groesse = { width: number; height: number };

/** Abstand zwischen Ziel und Karte und zum Bildrand. */
const ABSTAND = 12;
const RAND = 12;

function klemmen(wert: number, min: number, max: number): number {
  return Math.min(Math.max(wert, min), Math.max(min, max));
}

export type Platz = { top: number; left: number; verdeckt: boolean };

export function karteSetzen(ziel: Kasten | null, karte: Groesse, bild: Groesse): Platz {
  const maxLinks = bild.width - karte.width - RAND;
  const maxOben = bild.height - karte.height - RAND;

  if (!ziel) {
    return {
      top: klemmen((bild.height - karte.height) / 2, RAND, maxOben),
      left: klemmen((bild.width - karte.width) / 2, RAND, maxLinks),
      verdeckt: false,
    };
  }

  const links = klemmen(ziel.left, RAND, maxLinks);
  const darunter = ziel.top + ziel.height + ABSTAND;
  if (darunter <= maxOben) return { top: darunter, left: links, verdeckt: false };

  // Auch darüber muss die Karte ganz ins Bild passen — ein Ziel unter dem Bildrand hat oben viel Platz.
  const darueber = ziel.top - ABSTAND - karte.height;
  if (darueber >= RAND && darueber <= maxOben) {
    return { top: darueber, left: links, verdeckt: false };
  }

  const rechts = ziel.left + ziel.width + ABSTAND;
  if (rechts <= maxLinks) {
    return { top: klemmen(ziel.top, RAND, maxOben), left: rechts, verdeckt: false };
  }

  /*
   * Passt nichts, verdeckt die Karte etwas vom Ziel — dann so wenig wie
   * möglich: oben am Bildrand, wenn das Ziel unten liegt, sonst unten.
   */
  const unten = Math.max(RAND, maxOben);
  const ueberlappung = (oben: number) =>
    Math.max(0, Math.min(oben + karte.height, ziel.top + ziel.height) - Math.max(oben, ziel.top));
  const oben = ueberlappung(RAND) <= ueberlappung(unten) ? RAND : unten;
  return { top: oben, left: links, verdeckt: ueberlappung(oben) > 0 };
}

/** Der helle Ausschnitt um das Ziel, auf den sichtbaren Teil beschnitten. */
export function ausschnitt(ziel: Kasten, bild: Groesse, polster = 6): Kasten {
  const oben = Math.max(ziel.top - polster, 0);
  const links = Math.max(ziel.left - polster, 0);
  const unten = Math.min(ziel.top + ziel.height + polster, bild.height);
  const rechts = Math.min(ziel.left + ziel.width + polster, bild.width);
  return {
    top: oben,
    left: links,
    width: Math.max(rechts - links, 0),
    height: Math.max(unten - oben, 0),
  };
}

/*
 * Rollt das Ziel herein? Ja, wenn zu wenig davon zu sehen ist: ganz, wenn
 * es klein ist, sonst mindestens 80 Pixel. Eine lange Liste, deren Anfang
 * dasteht, bleibt, wo sie ist — sonst verschwände darüber die Überschrift.
 */
export function mussRollen(ganz: Kasten, sichtbar: Kasten): boolean {
  if (sichtbar.width === 0 || sichtbar.height === 0) return true;
  return sichtbar.height < Math.min(ganz.height, 80) - 1;
}

/** Die Schnittmenge zweier Kästen; leer, wenn sie sich nicht berühren. */
export function schneiden(a: Kasten, b: Kasten): Kasten {
  const oben = Math.max(a.top, b.top);
  const links = Math.max(a.left, b.left);
  const unten = Math.min(a.top + a.height, b.top + b.height);
  const rechts = Math.min(a.left + a.width, b.left + b.width);
  return {
    top: oben,
    left: links,
    width: Math.max(rechts - links, 0),
    height: Math.max(unten - oben, 0),
  };
}

/*
 * Der Teil des Ziels, den man sieht. Die Einstiegsfragen etwa stehen in
 * einem Verlauf, der rollt; was darüber hinausragt, liegt unter dem
 * Eingabefeld. Ein Ausschnitt dort hinein zeigte auf das Falsche.
 *
 * Zuletzt zählt das Fenster selbst: Schmal rollt die ganze Seite, und ein
 * Ziel unter dem Bildrand ist nicht zu sehen, auch wenn kein Vorfahre es
 * abschneidet.
 */
export function sichtbarerTeil(element: HTMLElement): Kasten {
  let kasten: Kasten = element.getBoundingClientRect();
  for (let eltern = element.parentElement; eltern; eltern = eltern.parentElement) {
    if (eltern === document.documentElement) break;
    const stil = getComputedStyle(eltern);
    if (stil.overflowX === 'visible' && stil.overflowY === 'visible') continue;
    kasten = schneiden(kasten, eltern.getBoundingClientRect());
  }
  const fenster = {
    top: 0,
    left: 0,
    width: document.documentElement.clientWidth,
    height: window.innerHeight,
  };
  kasten = schneiden(kasten, fenster);

  // Das Eingabefeld klebt unten und deckt ab, was darunter durchrollt — auch ganz.
  for (const deckel of document.querySelectorAll<HTMLElement>('[data-rundgang-deckel]')) {
    if (deckel.contains(element)) continue;
    const { top, bottom } = deckel.getBoundingClientRect();
    const unten = kasten.top + kasten.height;
    if (top < unten && bottom >= unten) {
      kasten = { ...kasten, height: Math.max(0, top - kasten.top) };
    }
  }
  return kasten;
}

/*
 * Wohin der Rundgang rollt, rollt er danach zurück: Wer ihn mitten im
 * Gespräch startet, findet sich hinterher dort wieder, wo er war. Gemerkt
 * wird jeder Vorfahre beim ersten Mal, bevor etwas rollt.
 */
export function rollstandMerken(element: HTMLElement, stand: Map<Element, number>): void {
  for (let eltern = element.parentElement; eltern; eltern = eltern.parentElement) {
    if (!stand.has(eltern)) stand.set(eltern, eltern.scrollTop);
  }
}

export function rollstandZurueck(stand: Map<Element, number>): void {
  for (const [element, oben] of stand) element.scrollTop = oben;
  stand.clear();
}

/** Das erste sichtbare Element zu einer Liste von Zielen, oder `null` für die Mitte. */
export function zielFinden(ziele: readonly string[]): HTMLElement | null {
  for (const ziel of ziele) {
    for (const element of document.querySelectorAll<HTMLElement>(`[data-rundgang="${ziel}"]`)) {
      const kasten = element.getBoundingClientRect();
      if (kasten.width > 0 && kasten.height > 0) return element;
    }
  }
  return null;
}
