import { describe, expect, it } from 'vitest';
import { CHAT } from '@/app/app/chat/texte';
import { SPRACHEN } from '@/lib/i18n/sprachen';

/*
 * Unter einer Antwort steht, wie viel Text sie gekostet hat — mehr nicht.
 * Kein Modellname und kein Preis (Adam, 23.09.2026): Womit geantwortet wird
 * und was es kostet, ist Betriebssache und steht hinter der Anmeldung auf
 * der Verbrauchsseite. Der Server schickt den Namen gar nicht erst mit
 * (`src/lib/antwort/fragen.ts`).
 */
describe('Zeile unter der Antwort', () => {
  for (const sprache of SPRACHEN) {
    it(`nennt auf ${sprache} den Umfang, kein Modell, keinen Preis`, () => {
      const text = CHAT[sprache].antwort.verbrauch("2'429", '93');

      expect(text).toContain("2'429");
      expect(text).toContain('93');
      expect(text.toLowerCase()).not.toMatch(/claude|haiku|sonnet|opus|gpt|modell|model|modèle/);
      expect(text).not.toMatch(/USD|\$|€|CHF/);
    });
  }
});
