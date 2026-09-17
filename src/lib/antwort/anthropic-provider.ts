import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { env } from '@/lib/config/env';
import {
  ProviderFehler,
  type AntwortAnfrage,
  type AntwortErgebnis,
  type AntwortProvider,
} from './provider';
import { Modellantwort } from './schema';
import { SYSTEMINSTRUKTION, nutzernachricht } from './systeminstruktion';

/*
 * Der echte Adapter.
 *
 * Er nutzt strukturierte Ausgaben: Das Modell muss im Schema aus schema.ts
 * antworten, sonst kommt die Anfrage gar nicht erst durch. Das ersetzt die
 * Belegprüfung **nicht** — es stellt nur sicher, dass die Form stimmt. Ob die
 * Zitate echt sind, entscheidet danach belegpruefung.ts.
 */

/** Siehe Masterprompt Abschnitt 9. An das Modell angepasst, nicht geraten. */
const MAX_AUSGABE_TOKENS = 1200;
const ZEITLIMIT_MS = 60_000;

export class AnthropicProvider implements AntwortProvider {
  readonly name = 'anthropic';
  readonly istDemo = false;

  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey, timeout: ZEITLIMIT_MS, maxRetries: 1 });
  }

  async antworten(anfrage: AntwortAnfrage): Promise<AntwortErgebnis> {
    /*
     * Der Verlauf kommt vor die aktuelle Frage, die Fundstellen stecken in
     * der letzten Nutzernachricht. Dokumenttext steht nie im `system`-Feld.
     */
    const verlauf = anfrage.verlauf.map((eintrag) => ({
      role: eintrag.rolle === 'nutzer' ? ('user' as const) : ('assistant' as const),
      content: eintrag.text,
    }));

    let antwort;
    try {
      antwort = await this.client.messages.parse({
        model: env.AI_CHAT_MODEL,
        max_tokens: MAX_AUSGABE_TOKENS,
        system: SYSTEMINSTRUKTION,
        messages: [
          ...verlauf,
          { role: 'user', content: nutzernachricht(anfrage.frage, anfrage.abschnitte) },
        ],
        output_config: { format: zodOutputFormat(Modellantwort) },
      });
    } catch (fehler) {
      throw uebersetzeFehler(fehler);
    }

    // Eine Verweigerung ist ein eigener Zustand, kein Fehler und keine
    // Antwort. Sie darf nicht als «keine Grundlage» durchgehen.
    if (antwort.stop_reason === 'refusal') {
      throw new ProviderFehler('abgelehnt', 'Das Modell hat die Anfrage abgelehnt.');
    }

    // `parsed_output` ist null, wenn das Modell das Schema nicht getroffen hat.
    if (!antwort.parsed_output) {
      throw new ProviderFehler(
        'ungueltige_ausgabe',
        'Das Modell hat nicht im vorgegebenen Format geantwortet.',
      );
    }

    return {
      antwort: antwort.parsed_output,
      verbrauch: {
        modell: antwort.model,
        eingabeTokens: antwort.usage.input_tokens,
        ausgabeTokens: antwort.usage.output_tokens,
      },
    };
  }
}

/**
 * Übersetzt Fehler des SDK in die Codes der Schnittstelle.
 *
 * Wichtig für die Oberfläche: Zeitüberschreitung, Ablehnung und ungültige
 * Ausgabe sind **verschiedene Zustände** und bekommen verschiedene Meldungen.
 * Ein pauschales «Fehler beim Antworten» würde einen Providerausfall wie
 * einen Produktfehler aussehen lassen.
 */
function uebersetzeFehler(fehler: unknown): ProviderFehler {
  if (fehler instanceof Anthropic.APIConnectionTimeoutError) {
    return new ProviderFehler('zeitlimit', 'Der Anbieter hat nicht rechtzeitig geantwortet.');
  }
  if (fehler instanceof Anthropic.APIConnectionError) {
    return new ProviderFehler('nicht_erreichbar', 'Der Anbieter ist nicht erreichbar.');
  }
  if (fehler instanceof Anthropic.APIError) {
    return new ProviderFehler(
      'nicht_erreichbar',
      `Der Anbieter meldet einen Fehler (${fehler.status ?? 'ohne Status'}).`,
    );
  }
  return new ProviderFehler('nicht_erreichbar', 'Unerwarteter Fehler beim Anbieter.');
}

/**
 * Wählt den Adapter nach Konfiguration.
 *
 * **Kein Rückfall auf die Demo.** Steht `AI_MODE=live`, wird live gefragt;
 * scheitert das, ist es ein Fehler. Eine stille Ersatzantwort sähe aus wie
 * eine echte, und niemand wüsste hinterher, welche Antwort je ein Modell
 * gesehen hat.
 */
export function providerWaehlen(): AntwortProvider | null {
  if (env.AI_MODE !== 'live') return null;
  const schluessel = env.ANTHROPIC_API_KEY;
  if (!schluessel) return null; // Der Konfigurationscheck verhindert das bereits.
  return new AnthropicProvider(schluessel);
}
