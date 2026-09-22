import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { anmelden, fertigesDokument, kontoAnlegen, kontoEntfernen, type Konto } from './konto';

/*
 * Der Rundgang (E43): einmal von selbst, mit der Tastatur ganz zu gehen,
 * mit Escape zu beenden, jederzeit wieder zu starten — und die Karte
 * bleibt auch bei 320 Pixeln im Bild.
 *
 * Alle anderen Tests beginnen als Besucher, die ihn schon kennen
 * (`playwright.config.ts`). Hier nicht.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const DIALOG = 'Rundgang durch Evidarium';

async function demoOeffnen(page: Page) {
  const zufall = () => Math.floor(Math.random() * 254) + 1;
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': `198.18.${zufall()}.${zufall()}` });
  const antwort = await page.goto('/demo');
  test.skip(antwort?.status() === 404, 'Demo ist nicht eingeschaltet oder nicht befüllt');
}

/*
 * Liegt die Karte ganz im Bild? Bei 320 Pixeln ist das nicht
 * selbstverständlich. Abgefragt, bis es stimmt: Nach einem Schrittwechsel
 * wächst die Karte mit dem neuen Text, und die neue Lage folgt ein Bild später.
 */
async function karteImBild(page: Page) {
  const bild = page.viewportSize();
  await expect
    .poll(async () => {
      const karte = await page.locator('.rundgang-karte').boundingBox();
      if (!karte || !bild) return false;
      return (
        karte.x >= 0 &&
        karte.y >= 0 &&
        karte.x + karte.width <= bild.width + 1 &&
        karte.y + karte.height <= bild.height + 1
      );
    })
    .toBe(true);
}

test('kommt beim ersten Besuch von selbst und führt mit Enter durch', async ({ page }) => {
  await demoOeffnen(page);
  const dialog = page.getByRole('dialog', { name: DIALOG });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Schritt 1 von 6')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Weiter' })).toBeFocused();

  for (let schritt = 2; schritt <= 6; schritt++) {
    await page.keyboard.press('Enter');
    await expect(dialog.getByText(`Schritt ${schritt} von 6`)).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Weiter|Loslegen/ })).toBeFocused();
    await karteImBild(page);
  }

  // Im letzten Schritt beendet «Loslegen»; ein zweiter Knopf dafür wäre doppelt.
  await expect(dialog.getByRole('button', { name: 'Beenden' })).toHaveCount(0);
  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('textbox', { name: 'Deine Frage' })).toBeFocused();

  // Einmal gesehen, kommt er nicht wieder von selbst.
  await page.reload();
  await expect(page.getByRole('button', { name: 'Rundgang' })).toBeVisible();
  await page.evaluate(
    () => new Promise((fertig) => requestAnimationFrame(() => requestAnimationFrame(fertig))),
  );
  await expect(page.getByRole('dialog', { name: DIALOG })).toHaveCount(0);
});

test('Escape beendet, der Knopf startet von vorn', async ({ page }) => {
  await demoOeffnen(page);
  const dialog = page.getByRole('dialog', { name: DIALOG });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Weiter' }).click();
  await expect(dialog.getByText('Schritt 2 von 6')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('evidarium.rundgang.demo'))).toBe(
    'gesehen',
  );

  /*
   * Per Tastatur gestartet: Safari fokussiert Knöpfe beim Klicken nicht, und
   * wohin der Fokus zurückkehrt, zählt für die, die mit der Tastatur arbeiten.
   */
  await page.getByRole('button', { name: 'Rundgang' }).focus();
  await page.keyboard.press('Enter');
  await expect(dialog.getByText('Schritt 1 von 6')).toBeVisible();
  await dialog.getByRole('button', { name: 'Beenden' }).click();
  await expect(dialog).toBeHidden();
  // Der Fokus kehrt zum Knopf zurück, von dem aus der Rundgang begann.
  await expect(page.getByRole('button', { name: 'Rundgang' })).toBeFocused();
});

test('der Ausschnitt liegt auf den Einstiegsfragen', async ({ page }) => {
  await demoOeffnen(page);
  const dialog = page.getByRole('dialog', { name: DIALOG });
  await dialog.getByRole('button', { name: 'Weiter' }).click();
  await dialog.getByRole('button', { name: 'Weiter' }).click();
  await expect(dialog.getByRole('heading', { name: 'Fragen' })).toBeVisible();

  /*
   * Die erste Einstiegsfrage liegt im hellen Ausschnitt. Das Loch sind die
   * letzten fünf Ecken des Vielecks: oben links, oben rechts, unten rechts,
   * unten links und zurück.
   */
  const frage = page.getByRole('button', { name: /Wer hilft beim Onboarding/ });
  await expect
    .poll(async () => {
      const kasten = await frage.boundingBox();
      if (!kasten) return false;
      const punkt = { x: kasten.x + 10, y: kasten.y + kasten.height / 2 };
      return page.locator('.rundgang-schleier').evaluate((schleier, p) => {
        const ecken = schleier.style.clipPath
          .replace(/^polygon\(|\)$/g, '')
          .split(',')
          .slice(-5)
          .map((ecke) => ecke.trim().split(/\s+/).map(parseFloat));
        const [links, oben] = ecken[0] ?? [];
        const [rechts] = ecken[1] ?? [];
        const [, unten] = ecken[2] ?? [];
        if (links === undefined || oben === undefined) return false;
        if (rechts === undefined || unten === undefined) return false;
        return p.x > links && p.x < rechts && p.y > oben && p.y < unten;
      }, punkt);
    })
    .toBe(true);
});

test('auf Französisch', async ({ page, context, baseURL }) => {
  await context.addCookies([
    { name: 'evidarium_sprache', value: 'fr', url: baseURL ?? 'http://localhost:3100' },
  ]);
  await demoOeffnen(page);
  const dialog = page.getByRole('dialog', { name: 'Visite guidée d’Evidarium' });
  await expect(dialog.getByText('Étape 1 sur 6')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Suivant' })).toBeFocused();
});

test.describe('ohne Bewegung', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  for (const thema of ['dark', 'light'] as const) {
    test(`axe ohne Befund mit offenem Rundgang, ${thema}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: thema, reducedMotion: 'reduce' });
      await demoOeffnen(page);
      const dialog = page.getByRole('dialog', { name: DIALOG });
      await dialog.getByRole('button', { name: 'Weiter' }).click();
      await expect(dialog.getByText('Schritt 2 von 6')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);

      const ergebnis = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(ergebnis.violations.map((v) => v.id)).toEqual([]);
    });
  }
});

test.describe('in der Anwendung', () => {
  let konto: Konto | undefined;

  test.beforeAll(async () => {
    const url = process.env.DATABASE_URL;
    test.skip(!url, 'DATABASE_URL fehlt');
    konto = await kontoAnlegen(url ?? '');
    await fertigesDokument(konto, 'Handbuch.txt');
  });

  test.afterAll(async () => {
    await kontoEntfernen(konto);
  });

  test('erklärt Hochladen, Auswahl, Fragen und Urteil', async ({ page, context, baseURL }) => {
    if (konto) await anmelden(context, konto, baseURL ?? 'http://localhost:3100');
    await page.goto('/app/chat');
    const dialog = page.getByRole('dialog', { name: DIALOG });
    await expect(dialog.getByText('Schritt 1 von 6')).toBeVisible();

    const titel = ['Dokumente und Projekte', 'Worin gesucht wird', 'Fragen', 'Das Urteil'];
    for (const name of titel) {
      await dialog.getByRole('button', { name: 'Weiter' }).click();
      await expect(dialog.getByRole('heading', { name })).toBeVisible();
      await karteImBild(page);
    }
    await dialog.getByRole('button', { name: 'Weiter' }).click();
    await dialog.getByRole('button', { name: 'Loslegen' }).click();
    await expect(dialog).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('evidarium.rundgang.app'))).toBe(
      'gesehen',
    );
  });
});
