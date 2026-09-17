import { normalisieren } from './belegpruefung';
import type { AntwortAnfrage, AntwortErgebnis, AntwortProvider } from './provider';
import type { Aussage } from './schema';

/*
 * Der Demo-Adapter.
 *
 * Er ruft kein Modell auf und kostet nichts. Er ist **kein Rückfall** für
 * einen fehlgeschlagenen echten Aufruf — das steht in der Schnittstelle und
 * gilt ohne Ausnahme.
 *
 * Was er tut: Er nimmt den bestqualifizierten Abschnitt und zitiert daraus
 * **wörtlich** einen Satz. Damit durchläuft er dieselbe Belegprüfung wie eine
 * echte Antwort — das ist der Zweck. Ein Demo-Adapter, der die Prüfung
 * umginge, würde genau den Pfad ungetestet lassen, auf den es ankommt.
 *
 * Was er ausdrücklich **nicht** tut: verstehen. Er beantwortet die Frage
 * nicht, er zeigt die Stelle. Ein bestandener Demo-Lauf ist darum **keine**
 * Aussage über die Qualität der Antworten.
 */

/**
 * Erster vollständiger Satz eines Abschnitts, ohne die Kopfzeile mit dem
 * Dateinamen. Als Zitat kurz genug, dass die Prüfung nicht an Kleinigkeiten
 * scheitert.
 */
function ersterSatz(text: string): string | null {
  const ohneKopf = text.includes('\n\n') ? text.slice(text.indexOf('\n\n') + 2) : text;
  const sauber = normalisieren(ohneKopf);
  if (sauber === '') return null;

  const treffer = /^.{20,240}?[.!?](\s|$)/.exec(sauber);
  const satz = (treffer?.[0] ?? sauber.slice(0, 200)).trim();
  return satz === '' ? null : satz;
}

export class DemoProvider implements AntwortProvider {
  readonly name = 'demo';
  readonly istDemo = true;

  antworten(anfrage: AntwortAnfrage): Promise<AntwortErgebnis> {
    const besterAbschnitt = anfrage.abschnitte[0];

    // Ohne Fundstelle gibt es nichts zu zeigen — und das ist eine gültige,
    // ehrliche Antwort, kein Fehler.
    if (!besterAbschnitt) {
      return Promise.resolve({
        antwort: {
          kategorie: 'keine_grundlage',
          aussagen: [
            {
              text: 'In den ausgewählten Dokumenten wurde keine passende Stelle gefunden.',
              belege: [],
            },
          ],
        },
        verbrauch: null,
      });
    }

    const zitat = ersterSatz(besterAbschnitt.text);
    if (zitat === null) {
      return Promise.resolve({
        antwort: {
          kategorie: 'keine_grundlage',
          aussagen: [{ text: 'Die gefundene Stelle enthält keinen lesbaren Satz.', belege: [] }],
        },
        verbrauch: null,
      });
    }

    const aussage: Aussage = {
      text: `Demo-Antwort ohne Modell: Zur Frage «${anfrage.frage}» passt diese Stelle am besten.`,
      belege: [{ sourceId: besterAbschnitt.sourceId, zitat }],
    };

    return Promise.resolve({
      antwort: { kategorie: 'teilweise_belegt', aussagen: [aussage] },
      verbrauch: null,
    });
  }
}
