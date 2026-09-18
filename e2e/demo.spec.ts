import { expect, test } from '@playwright/test';

/*
 * Die öffentliche Demo auf allen drei Prüfbreiten.
 *
 * Geprüft wird vor allem, was **nicht** da sein darf: kein Upload, keine
 * Dokumentauswahl. Die Demo hängt an einem fremden Geldbeutel; jede
 * Bedienmöglichkeit, die dort auftaucht, ist eine Angriffsfläche.
 *
 * Ist die Demo nicht eingeschaltet oder nicht befüllt, wird der Test
 * übersprungen und **nicht** als bestanden gemeldet. In der CI ist das der
 * Normalfall: Ein Korpus dort bräuchte das Embedding-Modell.
 */

test.beforeEach(async ({ page }) => {
  const antwort = await page.goto('/demo');
  test.skip(antwort?.status() === 404, 'Demo ist nicht eingeschaltet oder nicht befüllt');
});

test('zeigt Korpus und Frageformular', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Frag diese Dokumente etwas.' })).toBeVisible();
  await expect(page.getByText('Durchsucht wird in')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Frage stellen' })).toBeVisible();
});

test('erlaubt eigene Dateien, aber keine Dokumentauswahl', async ({ page }) => {
  /*
   * Hochladen ja — seit dem 18.09.2026, eng begrenzt und mit automatischer
   * Löschung. Die Dokumentauswahl bleibt beim Server: Wer IDs schicken darf,
   * probiert fremde.
   */
  await expect(page.locator('input[type="file"]')).toHaveCount(1);
  await expect(page.locator('input[type="checkbox"]')).toHaveCount(0);
  // Genau die Knöpfe der Dokumentauswahl, nicht das Dateifeld: Dessen
  // Beschriftung enthält ebenfalls «auswählen».
  await expect(page.getByRole('button', { name: /(Alle|Keines) auswählen/ })).toHaveCount(0);
});

test('sagt vor dem Hochladen, dass geloescht wird', async ({ page }) => {
  // Der Hinweis muss **vor** dem Formular stehen, nicht danach.
  const hinweis = page.getByText(/automatisch gelöscht/i);
  await expect(hinweis).toBeVisible();

  const hinweisOben = (await hinweis.boundingBox())?.y ?? 0;
  const feldOben = (await page.locator('input[type="file"]').boundingBox())?.y ?? 0;
  expect(hinweisOben).toBeLessThan(feldOben);
});

test('keine Schrift unter 16 px', async ({ page }) => {
  const zuKlein = await page.evaluate(() => {
    const treffer: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('body *')) {
      if (el.offsetParent === null && el.tagName !== 'BODY') continue;
      const eigenerText = Array.from(el.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim(),
      );
      if (!eigenerText) continue;
      const px = parseFloat(getComputedStyle(el).fontSize);
      if (px < 16) treffer.push(`${el.tagName.toLowerCase()} ${px}px`);
    }
    return treffer;
  });
  expect(zuKlein).toEqual([]);
});

test('kein Querscrollen', async ({ page }) => {
  const ueberbreit = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(ueberbreit).toBe(false);
});
