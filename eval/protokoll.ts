import type { FrageErgebnis } from '@/lib/antwort/fragen';
import { PREISSTAND } from '@/lib/budget/preise';
import { env } from '@/lib/config/env';
import { FASSUNG, type Fall } from './faelle';
import type { Pruefung } from './pruefen';

/*
 * Das Protokoll enthält die **Antworttexte im Wortlaut**, nicht nur Haken.
 *
 * Eine Tabelle mit zwölf Haken ist kein Nachweis: Sie zeigt, dass mein
 * eigener Prüfcode zufrieden war. Wer beurteilen will, ob die Antworten
 * fachlich taugen, muss sie lesen können — dafür stehen sie hier, samt
 * Fundstelle und Zitat.
 */

export type Zeile = {
  fall: Fall;
  pruefung: Pruefung;
  ergebnis: FrageErgebnis;
  dauerMs: number;
  kostenUsd: number;
};

function antwortBlock(ergebnis: FrageErgebnis): string {
  if (ergebnis.art === 'keine_treffer') return '_Die Suche fand keine Stelle._';
  if (ergebnis.art === 'budget') return `_Budgetgrenze: ${ergebnis.nachricht}_`;
  if (ergebnis.art === 'fehler') return `_Fehler ${ergebnis.code}: ${ergebnis.nachricht}_`;

  return ergebnis.aussagen
    .map((aussage) => {
      const belege = aussage.belege
        .map((beleg) => {
          const ort = beleg.page !== null ? `, S. ${beleg.page}` : '';
          return `  - \`${beleg.filename}${ort}\`: «${beleg.zitat}»`;
        })
        .join('\n');
      return belege === '' ? `- ${aussage.text}` : `- ${aussage.text}\n${belege}`;
    })
    .join('\n');
}

export function protokoll(zeilen: Zeile[], korpus: string[]): string {
  const bestanden = zeilen.filter((z) => z.pruefung.bestanden).length;
  const kosten = zeilen.reduce((summe, z) => summe + z.kostenUsd, 0);
  const dauer = zeilen.reduce((summe, z) => summe + z.dauerMs, 0);

  const jeArt = (art: Fall['art']) => {
    const teil = zeilen.filter((z) => z.fall.art === art);
    const ok = teil.filter((z) => z.pruefung.bestanden).length;
    return `${ok} von ${teil.length}`;
  };

  const tabelle = zeilen
    .map((z) => {
      const stand = z.pruefung.bestanden ? 'bestanden' : '**gescheitert**';
      const maengel = z.pruefung.maengel.join('; ') || '—';
      return `| ${z.fall.id} | ${z.fall.art} | ${z.pruefung.kategorie} | ${stand} | ${(z.dauerMs / 1000).toFixed(1)} s | ${maengel} |`;
    })
    .join('\n');

  const faelle = zeilen
    .map(
      (z) => `### ${z.fall.id} · ${z.fall.art}

**Frage:** ${z.fall.frage}
**Auswahl:** ${z.fall.dokumente.length === korpus.length ? 'alle Dokumente' : z.fall.dokumente.map((d) => `\`${d}\``).join(', ')}
**Erwartet:** ${z.fall.erwartet.join(' oder ')}${z.fall.verboten ? ` · verboten: ${z.fall.verboten.map((v) => `«${v}»`).join(', ')}` : ''}
**Kategorie:** ${z.pruefung.kategorie} · ${z.pruefung.bestanden ? 'bestanden' : `gescheitert: ${z.pruefung.maengel.join('; ')}`}

${antwortBlock(z.ergebnis)}`,
    )
    .join('\n\n');

  return `# Evaluationsprotokoll

Erzeugt am ${new Date().toISOString().slice(0, 10)}. Fallsatz Fassung ${FASSUNG}.
Modus \`${env.AI_MODE}\`, Modell \`${env.AI_CHAT_MODEL}\`, Preisstand ${PREISSTAND}.

**Diese Datei wird von \`scripts/evaluieren.ts\` geschrieben.** Sie enthält
gemessene Ergebnisse eines Laufs, keine Zielwerte. Ein gescheiterter Fall wird
nicht dadurch behoben, dass man den Fall umschreibt.

## Ergebnis

| Grösse                 | Wert                             |
| ---------------------- | -------------------------------- |
| Bestanden              | **${bestanden} von ${zeilen.length}** |
| Direkte Fragen         | ${jeArt('direkt')} |
| Über mehrere Dokumente | ${jeArt('mehrere')} |
| Nicht beantwortbar     | ${jeArt('nicht_beantwortbar')} |
| Konflikt               | ${jeArt('konflikt')} |
| Nachfrage              | ${jeArt('nachfrage')} |
| Prompt-Injection       | ${jeArt('injektion')} |
| Laufzeit gesamt        | ${(dauer / 1000).toFixed(1)} s |
| Kosten gesamt          | ${kosten.toFixed(4)} USD |

| Fall | Art | Kategorie | Stand | Dauer | Mängel |
| ---- | --- | --------- | ----- | ----- | ------ |
${tabelle}

## Was hier **nicht** gemessen wird

- **Gültigkeit der Quellen-IDs und wörtliche Zitattreue** stehen nicht als
  Quote in dieser Tabelle, weil sie keine sein können: Eine Antwort mit
  erfundener Quellen-ID oder geglättetem Zitat besteht die Belegprüfung nicht
  und wird gar nicht erst ausgeliefert. Jede Zeile oben, die eine Kategorie
  trägt, hat diese Prüfung bereits bestanden.
- **Fachliche Richtigkeit** braucht eine menschliche Stichprobe. Die formale
  Prüfung sieht, ob «zwei Stunden» im Text steht — nicht, ob die Antwort als
  Ganzes Sinn ergibt. Dafür stehen die Antworten unten im Wortlaut.

## Antworten im Wortlaut

${faelle}

## Korpus

${korpus.map((datei) => `- \`${datei}\``).join('\n')}

Erzeugt mit \`bun scripts/korpus-erzeugen.ts\` aus \`eval/inhalte.ts\`.
Erfundene Firma, erfundene Fakten — die Begründung steht dort.
`;
}
