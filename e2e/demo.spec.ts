import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/*
 * Die öffentliche Demo auf allen Prüfbreiten und in allen Engines.
 *
 * Geprüft wird zweierlei: was **nicht** da sein darf — keine Dokumentauswahl;
 * die Demo hängt an einem fremden Geldbeutel, und wer IDs schicken darf,
 * probiert fremde — und dass der Chat so funktioniert, wie er aussieht.
 *
 * Ist die Demo nicht eingeschaltet oder nicht befüllt, wird der Test
 * übersprungen und **nicht** als bestanden gemeldet. In der CI ist das der
 * Normalfall: Ein Korpus dort bräuchte das Embedding-Modell.
 */

test.beforeEach(async ({ page }) => {
  /*
   * Jeder Test kommt von einer eigenen Adresse (Testbereich 198.18.0.0/15).
   * Sonst zählten alle Läufe eines Tages gegen dieselbe Grenze je Herkunft,
   * und der dritte Lauf scheiterte an ihr statt an einem Fehler.
   */
  const zufall = () => Math.floor(Math.random() * 254) + 1;
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': `198.18.${zufall()}.${zufall()}` });
  const antwort = await page.goto('/demo');
  test.skip(antwort?.status() === 404, 'Demo ist nicht eingeschaltet oder nicht befüllt');
});

/** Schmal liegt die Seitenspalte hinter einem Knopf. */
async function seitenspalteOeffnen(page: Page) {
  const knopf = page.getByRole('button', { name: 'Dokumente', exact: true });
  if (await knopf.isVisible()) await knopf.click();
}

async function ersteAntwort(page: Page) {
  await page.getByRole('button', { name: /Wer hilft beim Onboarding/ }).click();
  await expect(page.getByRole('heading', { level: 3 }).first()).toBeVisible({ timeout: 30_000 });
  /*
   * Fertig ist erst, wenn der Durchlauf abgeschlossen ist — «Neu beginnen»
   * erscheint genau dann. Davor rendert der Chat noch einmal, und ein
   * axe-Lauf dazwischen mass an veralteten Stellen: Die Frage-Blase lag für
   * ihn auf dem hellen Blatt darunter.
   */
  await expect(page.getByRole('button', { name: 'Neu beginnen' })).toBeVisible();
  await page.evaluate(
    () => new Promise((fertig) => requestAnimationFrame(() => requestAnimationFrame(fertig))),
  );
}

test('zeigt Korpus und Eingabefeld', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Frag diese Dokumente etwas.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Frage stellen' })).toBeVisible();
  await seitenspalteOeffnen(page);
  await expect(page.getByRole('heading', { name: 'Dokumente', exact: true })).toBeVisible();
});

test('erlaubt eigene Dateien, aber keine Dokumentauswahl', async ({ page }) => {
  /*
   * Hochladen ja — seit dem 18.09.2026, eng begrenzt und mit automatischer
   * Löschung. Die Dokumentauswahl bleibt beim Server.
   */
  await expect(page.locator('input[type="file"]')).toHaveCount(1);
  await expect(page.locator('input[type="checkbox"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^(Alle|Keines)$/ })).toHaveCount(0);
});

test('sagt vor dem Hochladen, dass gelöscht wird', async ({ page }) => {
  await seitenspalteOeffnen(page);
  // Der Hinweis muss **vor** dem Knopf stehen, nicht danach.
  const hinweis = page.getByText(/automatisch gelöscht/i);
  await expect(hinweis).toBeVisible();

  const hinweisOben = (await hinweis.boundingBox())?.y ?? 0;
  const knopfOben = (await page.getByText('Datei hinzufügen').boundingBox())?.y ?? 0;
  expect(hinweisOben).toBeLessThan(knopfOben);
});

test('eine Einstiegsfrage stellt die Frage und zeigt das Urteil', async ({ page }) => {
  await ersteAntwort(page);

  await expect(page.locator('.frage-blase')).toHaveText('Wer hilft beim Onboarding?');
  await expect(page.getByRole('button', { name: /^Geprüft in \d+\.\d s$/ })).toBeVisible();
  // Die Einstiegsfragen sind weg, der Fokus steht im Eingabefeld — nicht im Nichts.
  await expect(page.getByRole('button', { name: /Wer hilft beim Onboarding/ })).toHaveCount(0);
  await expect(page.getByLabel('Deine Frage')).toBeFocused();
});

test('Umschalt+Enter macht eine neue Zeile, Enter sendet', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Am Telefon sendet nur der Knopf');
  const feld = page.getByLabel('Deine Frage');
  await feld.fill('Wie lange werden');
  await feld.press('Shift+Enter');
  await feld.pressSequentially('Sicherungen aufbewahrt?');
  await expect(feld).toHaveValue('Wie lange werden\nSicherungen aufbewahrt?');

  await feld.press('Enter');
  await expect(page.locator('.frage-blase')).toHaveCount(1);
  await expect(feld).toHaveValue('');
});

test('die Schritte klappen auf und zu', async ({ page }) => {
  await ersteAntwort(page);
  const knopf = page.getByRole('button', { name: /^Geprüft in/ });
  await expect(knopf).toHaveAttribute('aria-expanded', 'false');
  await knopf.click();
  await expect(knopf).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText('Belege werden geprüft')).toBeVisible();
});

test('Neu beginnen leert den Verlauf', async ({ page }) => {
  await ersteAntwort(page);
  await page.getByRole('button', { name: 'Neu beginnen' }).click();
  await expect(page.locator('.frage-blase')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Wer hilft beim Onboarding/ })).toBeVisible();
});

test.describe('mit Antwort', () => {
  // Ohne Bewegung geprüft: Ein Blatt mitten im Einblenden hätte zu wenig Kontrast.
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  for (const thema of ['dark', 'light'] as const) {
    test(`axe ohne Befund, ${thema}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: thema, reducedMotion: 'reduce' });
      await ersteAntwort(page);
      await page.evaluate(() => {
        for (const animation of document.getAnimations()) animation.finish();
      });
      const ergebnis = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      // Mit der Meldung von axe, sonst sagt ein Kontrastbefund nicht, welche Farben er sah.
      const befunde = ergebnis.violations.map(
        (v) =>
          `${v.id}: ${v.nodes.map((n) => `${n.target.join(' ')} (${n.any.map((a) => a.message).join('; ')})`).join(', ')}`,
      );
      expect(befunde).toEqual([]);
    });
  }
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
