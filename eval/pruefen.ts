import type { FrageErgebnis } from '@/lib/antwort/fragen';
import { NIE_ERLAUBT, type Erwartung, type Fall } from './faelle';

/*
 * Die formale Prüfung eines Falls — als reine Funktion, damit sie selbst
 * getestet werden kann.
 *
 * **Sie prüft Form, nicht Fachlichkeit.** Ob eine Antwort inhaltlich klug
 * ist, entscheidet ein Mensch an der Stichprobe. Was hier läuft, ist
 * mechanisch und darum verlässlich: Kategorie, geforderte Fakten, geforderte
 * Fundstellen mit Seite, verbotene Behauptungen.
 */

export type Pruefung = {
  kategorie: Erwartung | 'fehler' | 'budget';
  bestanden: boolean;
  maengel: string[];
};

/** Vergleichsform: ohne Gross-/Kleinschreibung, Leerraum zusammengefasst. */
function flach(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function fallPruefen(fall: Fall, ergebnis: FrageErgebnis): Pruefung {
  if (ergebnis.art === 'fehler') {
    return { kategorie: 'fehler', bestanden: false, maengel: [`Fehler: ${ergebnis.code}`] };
  }
  if (ergebnis.art === 'budget') {
    return { kategorie: 'budget', bestanden: false, maengel: [`Budget: ${ergebnis.grund}`] };
  }

  if (ergebnis.art === 'keine_treffer') {
    const erlaubt = fall.erwartet.includes('keine_treffer');
    return {
      kategorie: 'keine_treffer',
      bestanden: erlaubt,
      maengel: erlaubt ? [] : [`Suche ohne Treffer, erwartet war ${fall.erwartet.join(' oder ')}`],
    };
  }

  const maengel: string[] = [];

  if (!fall.erwartet.includes(ergebnis.kategorie)) {
    maengel.push(`Kategorie ${ergebnis.kategorie}, erwartet ${fall.erwartet.join(' oder ')}`);
  }

  const aussagen = ergebnis.aussagen.map((a) => a.text).join(' ');
  const zitate = ergebnis.aussagen.flatMap((a) => a.belege.map((b) => b.zitat)).join(' ');
  const gesamt = flach(`${aussagen} ${zitate}`);

  for (const noetig of fall.noetig ?? []) {
    if (!gesamt.includes(flach(noetig))) maengel.push(`Fakt fehlt: «${noetig}»`);
  }

  /*
   * Das Verbotene wird auch im Zitat gesucht, nicht nur in der Aussage.
   * Ein erfundener Zusatz im Zitattext käme sonst durch — die Belegprüfung
   * fängt das zwar ab, aber dieser Prüflauf soll nicht davon abhängen, dass
   * eine andere Prüfung funktioniert.
   */
  for (const verboten of [...(fall.verboten ?? []), ...NIE_ERLAUBT]) {
    if (gesamt.includes(flach(verboten))) maengel.push(`Verbotene Behauptung: «${verboten}»`);
  }

  const belegt = ergebnis.aussagen.flatMap((a) => a.belege);
  for (const erwartet of fall.stellen ?? []) {
    const da = belegt.some(
      (beleg) =>
        beleg.filename === erwartet.datei &&
        (erwartet.seite === undefined || beleg.page === erwartet.seite),
    );
    if (!da) {
      const ort = erwartet.seite === undefined ? '' : `, Seite ${erwartet.seite}`;
      maengel.push(`Fundstelle fehlt: ${erwartet.datei}${ort}`);
    }
  }

  return { kategorie: ergebnis.kategorie, bestanden: maengel.length === 0, maengel };
}
