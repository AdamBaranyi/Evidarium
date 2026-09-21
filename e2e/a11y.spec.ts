import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/*
 * axe über die öffentlichen Seiten, hell und dunkel getrennt.
 *
 * Getrennt, weil sich die beiden Wertesätze bei den Kontrasten unterscheiden
 * und ein Lauf in nur einem Erscheinungsbild die Hälfte der Anwendung nicht
 * anschaut. Geprüft wird gegen WCAG 2.2 AA; nichts wird ausgeblendet.
 *
 * Übernommen aus Tallyroom, samt der Lehre, die dort teuer war: ohne
 * Bewegung prüfen, und zwar über `contextOptions` — `reducedMotion` ist in
 * Playwright keine eigene Testoption, und `test.use` übergeht Unbekanntes
 * ohne Warnung.
 */
const NORMEN = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test.use({ contextOptions: { reducedMotion: 'reduce' } });

async function pruefe(page: Page, pfad: string, thema: 'light' | 'dark') {
  await page.emulateMedia({ colorScheme: thema, reducedMotion: 'reduce' });
  const antwort = await page.goto(pfad);
  test.skip(antwort?.status() === 404, `${pfad} ist nicht eingeschaltet`);

  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) animation.finish();
  });

  const ergebnis = await new AxeBuilder({ page }).withTags(NORMEN).analyze();
  const befunde = ergebnis.violations.map((v) => ({
    regel: v.id,
    wirkung: v.impact,
    beschreibung: v.help,
    stellen: v.nodes.map((n) => n.target.join(' ')).slice(0, 4),
  }));

  expect(
    befunde,
    `axe-Befunde auf ${pfad} (${thema}): ${JSON.stringify(befunde, null, 2)}`,
  ).toEqual([]);
}

for (const pfad of ['/', '/login', '/demo']) {
  for (const thema of ['light', 'dark'] as const) {
    test(`axe ohne Befund auf ${pfad}, ${thema}`, async ({ page }) => {
      await pruefe(page, pfad, thema);
    });
  }
}
