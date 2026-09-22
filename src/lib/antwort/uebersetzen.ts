import { env } from '@/lib/config/env';
import { MELDUNGEN } from '@/lib/i18n/meldungen';
import type { Sprache } from '@/lib/i18n/sprachen';
import type { FrageErgebnis } from './fragen';

/**
 * Übersetzt Grenzen und Fehler eines Ergebnisses in die Sprache der Anfrage —
 * an genau einer Stelle, der Grenze des Stroms. Dahinter bleibt alles
 * deutsch: Protokoll, Evaluation, Tests. Unbekannte Codes behalten ihren
 * deutschen Satz, statt zu verschwinden.
 *
 * `demo`: In der öffentlichen Demo gibt es keine Anmeldung, also auch kein
 * «melde dich neu an». Dort ist das Kontingent eines je Besuch.
 */
export function ergebnisUebersetzen(
  ergebnis: FrageErgebnis,
  sprache: Sprache,
  demo: boolean,
): FrageErgebnis {
  const t = MELDUNGEN[sprache].strom;

  if (ergebnis.art === 'budget') {
    const texte: Record<string, string> = {
      sitzung: demo ? t.besuch(env.FRAGEN_JE_SITZUNG) : t.sitzung(env.FRAGEN_JE_SITZUNG),
      tag: t.tag,
      monat: t.monat,
      kein_preis: t.keinPreis,
      herkunft: t.herkunft(env.DEMO_FRAGEN_JE_HERKUNFT_TAG),
    };
    return { ...ergebnis, nachricht: texte[ergebnis.grund] ?? ergebnis.nachricht };
  }

  if (ergebnis.art === 'fehler') {
    const texte: Record<string, string> = {
      einbetten_aus: t.einbettenAus,
      einbetten: t.einbetten,
      belege_ungueltig: t.belegeUngueltig,
      zeitlimit: t.zeitlimit,
      abgelehnt: t.modellAbgelehnt,
      ungueltige_ausgabe: t.ungueltigeAusgabe,
      nicht_erreichbar: t.nichtErreichbar,
      unerwartet: t.unerwartet,
    };
    return { ...ergebnis, nachricht: texte[ergebnis.code] ?? ergebnis.nachricht };
  }

  return ergebnis;
}
