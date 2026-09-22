import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { demoOeffnen } from './demo-oeffnen';

/*
 * Vier Sprachen (E42): Die Wahl greift per Knopf, per Cookie und per
 * Browsereinstellung, `lang` stimmt, und axe hat auch auf Französisch und
 * Englisch nichts zu melden.
 *
 * Die erwarteten Sätze stehen hier ausgeschrieben, nicht aus den Katalogen
 * geholt: Ein Test, der den Katalog gegen sich selbst prüft, bemerkt keinen
 * falschen Text.
 */

const TITEL = {
  de: 'Antworten aus deinen Dokumenten, mit Quellen zum Nachlesen.',
  fr: 'Des réponses tirées de vos documents, avec des sources à relire.',
  it: 'Risposte tratte dai Suoi documenti, con fonti da rileggere.',
  en: 'Answers from your documents, with sources to read up on.',
} as const;

for (const [sprache, titel] of Object.entries(TITEL)) {
  test(`Startseite auf ${sprache}: Titel und lang`, async ({ page, context, baseURL }) => {
    await context.addCookies([
      { name: 'evidarium_sprache', value: sprache, url: baseURL ?? 'http://localhost:3100' },
    ]);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', `${sprache}-CH`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(titel);
  });
}

test('der Knopf wechselt die Sprache, und sie bleibt', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(TITEL.de);

  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(TITEL.en);
  await expect(page.getByRole('button', { name: 'English' })).toHaveAttribute(
    'aria-current',
    'true',
  );

  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(TITEL.en);
});

test.describe('ohne eigene Wahl zählt der Browser', () => {
  test.use({ locale: 'fr-CH' });

  test('französischer Browser, französische Seite', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr-CH');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(TITEL.fr);
  });
});

test.describe('axe in anderen Sprachen', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  for (const sprache of ['fr', 'en'] as const) {
    for (const pfad of ['/', '/login', '/datenschutz']) {
      test(`axe ohne Befund auf ${pfad}, ${sprache}`, async ({ page, context, baseURL }) => {
        await context.addCookies([
          { name: 'evidarium_sprache', value: sprache, url: baseURL ?? 'http://localhost:3100' },
        ]);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(pfad);
        await page.evaluate(() => document.fonts.ready);
        const ergebnis = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(ergebnis.violations.map((v) => v.id)).toEqual([]);
      });
    }
  }
});

test('englische Demo: deutsche Zitate sind als deutsch ausgezeichnet', async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([
    { name: 'evidarium_sprache', value: 'en', url: baseURL ?? 'http://localhost:3100' },
  ]);
  await demoOeffnen(page);

  await page.getByRole('button', { name: /Who helps with onboarding/ }).click();
  const urteil = page.getByRole('heading', { level: 3 }).first();
  await expect(urteil).toHaveText(/Supported|Partly supported|No basis|Contradiction/, {
    timeout: 30_000,
  });
  await expect(page.locator('q').first()).toHaveAttribute('lang', 'de');
});
