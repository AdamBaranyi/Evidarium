import { expect, test, type Page } from '@playwright/test';

/*
 * Öffnet die Demo so, als käme der Besuch von einer eigenen Adresse
 * (Testbereich 198.18.0.0/15). Sonst zählten alle Läufe eines Tages gegen
 * dieselbe Grenze je Herkunft, und der dritte Lauf scheiterte an ihr statt
 * an einem Fehler.
 *
 * Ist die Demo aus, überspringt sich der Test und meldet das als «skipped»,
 * nicht als bestanden. Ist sie eingeschaltet (`DEMO_AKTIV`, so in der CI)
 * und antwortet trotzdem nicht, ist das ein Fehler: Ein fehlender Korpus
 * soll rot werden, nicht still übersprungen.
 */
export async function demoOeffnen(page: Page): Promise<void> {
  const zufall = () => Math.floor(Math.random() * 254) + 1;
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': `198.18.${zufall()}.${zufall()}` });
  const antwort = await page.goto('/demo');
  if (process.env.DEMO_AKTIV === 'true') {
    expect(antwort?.status(), 'Demo eingeschaltet, aber nicht erreichbar: Korpus geladen?').toBe(
      200,
    );
    return;
  }
  test.skip(antwort?.status() === 404, 'Demo ist nicht eingeschaltet');
}
