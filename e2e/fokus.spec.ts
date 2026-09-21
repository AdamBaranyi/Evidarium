import { expect, test } from '@playwright/test';

/*
 * Was axe nicht sieht: Fokus, Sprungmarke, Pause-Steuerung.
 *
 * Jeder Test hier hält einen Befund aus dem Prüfbericht fest, damit er beim
 * nächsten Umbau nicht still zurückkommt.
 */

/** Relative Leuchtdichte nach WCAG, aus `rgb(r, g, b)`. */
function leuchtdichte(farbe: string): number {
  const [r = 0, g = 0, b = 0] = (farbe.match(/\d+/g) ?? []).map(Number);
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function kontrast(a: string, b: string): number {
  const [hell, dunkel] = [leuchtdichte(a), leuchtdichte(b)].sort((x, y) => y - x);
  return ((hell ?? 0) + 0.05) / ((dunkel ?? 0) + 0.05);
}

test('die Sprungmarke ist das Erste und führt zum Inhalt', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');

  const erstes = page.locator(':focus');
  await expect(erstes).toHaveText('Zum Inhalt springen');
  await expect(erstes).toBeInViewport();

  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#inhalt$/);
});

for (const thema of ['dark', 'light'] as const) {
  test(`der Fokusring hebt sich vom Grund ab, ${thema}`, async ({ page }) => {
    /*
     * Befund B4: Der Ring nahm `currentColor` und war auf dem hellen
     * Hauptknopf im Dunkeln exakt so dunkel wie der Seitengrund — unsichtbar.
     * Gemessen wird der Ring gegen den Grund, auf dem er tatsächlich liegt.
     */
    await page.emulateMedia({ colorScheme: thema });
    await page.goto('/');

    const knopf = page.getByRole('link', { name: 'Ohne Anmeldung ausprobieren' });
    test.skip((await knopf.count()) === 0, 'Demo nicht eingeschaltet');
    await knopf.focus();

    const { ring, grund } = await knopf.evaluate((el) => ({
      ring: getComputedStyle(el).outlineColor,
      grund: getComputedStyle(document.body).backgroundColor,
    }));
    expect(kontrast(ring, grund), `Ring ${ring} auf ${grund}`).toBeGreaterThanOrEqual(3);
  });
}

test('die Vorführung lässt sich anhalten', async ({ page }) => {
  // Befund B3, WCAG 2.2.2: Bewegung über fünf Sekunden braucht eine Pause.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');

  const knopf = page.getByRole('button', { name: 'Anhalten' });
  await expect(knopf).toBeVisible();
  await knopf.click();

  const weiter = page.getByRole('button', { name: 'Abspielen' });
  await expect(weiter).toHaveAttribute('aria-pressed', 'true');

  // Angehalten steht das fertige Bild still: zweimal lesen, dasselbe Bild.
  const vorher = await page.locator('.vorfuehrung-inhalt').innerText();
  await page.waitForTimeout(1500);
  const nachher = await page.locator('.vorfuehrung-inhalt').innerText();
  expect(nachher).toBe(vorher);

  const hintergrund = await page
    .locator('.archiv span')
    .first()
    .evaluate((el) => getComputedStyle(el).animationPlayState);
  expect(hintergrund).toBe('paused');
});
