import type { Sprache } from '@/lib/i18n/sprachen';
import { frageBeantworten, type FrageAuftrag, type Phase } from './fragen';
import { ergebnisUebersetzen } from './uebersetzen';

/*
 * Die Antwort als Strom von NDJSON-Zeilen: erst die Arbeitsschritte, zuletzt
 * genau ein Ergebnis.
 *
 * **Gestreamt werden Arbeitsschritte, nicht Text.** Eine wortweise
 * hereintickernde Antwort wäre hier sogar schädlich: Der Text darf erst
 * erscheinen, wenn die Belegprüfung ihn freigegeben hat — und eine Antwort,
 * die halb dasteht und dann verschwindet, wäre schlimmer als eine, die drei
 * Sekunden später vollständig erscheint.
 *
 * Angemeldeter Chat und öffentliche Demo teilen sich diesen Weg. Zwei
 * getrennte Fassungen wären zwei Stellen, an denen die Belegprüfung
 * versehentlich übersprungen werden kann.
 */

export function ndjsonAntwort(
  auftrag: Omit<FrageAuftrag, 'melden'>,
  zusatzKopf: Record<string, string> = {},
  sprache: Sprache = 'de',
  demo = false,
): Response {
  const strom = new ReadableStream<Uint8Array>({
    async start(steuerung) {
      const kodierer = new TextEncoder();
      const zeile = (wert: unknown) =>
        steuerung.enqueue(kodierer.encode(`${JSON.stringify(wert)}\n`));

      try {
        const ergebnis = await frageBeantworten({
          ...auftrag,
          sprache,
          melden: (phase: Phase) => zeile({ art: 'phase', phase }),
        });
        zeile(ergebnisUebersetzen(ergebnis, sprache, demo));
      } catch (fehler) {
        // Bis hierher sind alle bekannten Fälle abgefangen. Was hier ankommt,
        // gehört ins Log — und in die Antwort nur als schlichter Satz.
        console.error('[antwort] unerwarteter Fehler', fehler);
        zeile(
          ergebnisUebersetzen(
            {
              art: 'fehler',
              code: 'unerwartet',
              nachricht: 'Beim Beantworten ist ein unerwarteter Fehler aufgetreten.',
            },
            sprache,
            demo,
          ),
        );
      } finally {
        steuerung.close();
      }
    },
  });

  return new Response(strom, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      // Sonst sammelt ein Reverse Proxy die Zeilen und liefert sie am Ende
      // gemeinsam aus — die Schrittanzeige wäre dann sinnlos.
      'X-Accel-Buffering': 'no',
      ...zusatzKopf,
    },
  });
}
