import { randomBytes, randomUUID } from 'node:crypto';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { Pool } from 'pg';

/*
 * Der angemeldete Bereich im Browser: Fragen, Dokumente, Verbrauch.
 *
 * Bis zum 22.09.2026 prüften die Browsertests nur öffentliche Seiten — axe,
 * 320 px und die Schriftgrösse hatten die Anwendung selbst nie gesehen.
 *
 * Die Sitzung entsteht direkt in der Datenbank, nicht über das
 * Anmeldeformular: Ein Passwort im Test wäre ein Passwort im Repository. Das
 * Testkonto trägt als Hash eine Zeichenkette, die kein Argon2-Hash ist — mit
 * ihm kann sich niemand anmelden, auch nicht mit dem richtigen Raten.
 */

const SESSION_COOKIE = 'evidarium_session';
const SEITEN = ['/app/chat', '/app/documents', '/app/usage'];

let pool: Pool;
let nutzerId = '';
let sitzung = '';

test.beforeAll(async () => {
  const url = process.env.DATABASE_URL;
  test.skip(!url, 'DATABASE_URL fehlt');
  pool = new Pool({ connectionString: url });
  const email = `e2e-${randomUUID()}@evidarium.test`;
  const nutzer = await pool.query<{ id: string }>(
    `insert into users (email, password_hash) values ($1, 'kein-passwort') returning id`,
    [email],
  );
  nutzerId = nutzer.rows[0]?.id ?? '';
  sitzung = randomBytes(32).toString('base64url');
  await pool.query(
    `insert into sessions (id, user_id, expires_at) values ($1, $2, now() + interval '1 hour')`,
    [sitzung, nutzerId],
  );
});

test.afterAll(async () => {
  // Die Sitzung hängt per Fremdschlüssel am Konto und geht mit.
  if (nutzerId) await pool.query('delete from users where id = $1', [nutzerId]);
  await pool?.end();
});

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([
    {
      name: SESSION_COOKIE,
      value: sitzung,
      url: baseURL ?? 'http://localhost:3100',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
});

test('ohne Dokumente zeigt der Chat den Weg zum Hochladen', async ({ page }) => {
  await page.goto('/app/chat');
  await expect(page.getByRole('link', { name: 'Lade zuerst ein Dokument hoch' })).toBeVisible();
});

test('Dokumente: eigener Knopf statt Dateifeld des Browsers', async ({ page }) => {
  await page.goto('/app/documents');
  await expect(page.getByText('Dokument hinzufügen')).toBeVisible();
  await expect(page.locator('input[type="file"]')).toHaveCount(1);
});

test('Projekt anlegen, im Chat wählen, umbenennen und löschen', async ({ page }) => {
  await page.goto('/app/documents');
  const name = `Probe ${randomUUID().slice(0, 6)}`;
  await page.getByLabel('Neues Projekt').fill(name);
  await page.getByRole('button', { name: 'Anlegen' }).click();
  await expect(page.getByRole('button', { name: `Bearbeiten: ${name}` })).toBeVisible();

  // Derselbe Name in anderer Schreibweise: abgelehnt, und das Getippte bleibt stehen.
  await page.getByLabel('Neues Projekt').fill(name.toUpperCase());
  await page.getByRole('button', { name: 'Anlegen' }).click();
  // Gefiltert: Next hat eine eigene, leere Region mit `role="alert"` für Seitenwechsel.
  await expect(
    page.getByRole('alert').filter({ hasText: 'Ein Projekt mit diesem Namen gibt es schon.' }),
  ).toBeVisible();
  await expect(page.getByLabel('Neues Projekt')).toHaveValue(name.toUpperCase());

  // Im Chat steht das Projekt in der Seitenspalte; ohne Dokumente bleibt sie erreichbar.
  await page.goto('/app/chat');
  // Schmal liegt die Seitenspalte hinter einem Knopf.
  const knopf = page.getByRole('button', { name: 'Dokumente', exact: true });
  if (await knopf.isVisible()) await knopf.click();
  await page.getByRole('link', { name: new RegExp(`^${name}`) }).click();
  await expect(page).toHaveURL(/\?projekt=/);
  // Der Wechsel lädt den Chat neu; schmal ist die Seitenspalte dann wieder zu.
  if (await knopf.isVisible()) await knopf.click();
  await expect(page.getByRole('link', { name: new RegExp(`^${name}`) })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByText(`In ${name} liegt noch kein fertiges Dokument.`)).toBeVisible();

  // Umbenennen und löschen.
  await page.goto('/app/documents');
  await page.getByRole('button', { name: `Bearbeiten: ${name}` }).click();
  await page.getByLabel('Neuer Name').fill(`${name} neu`);
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('button', { name: `Bearbeiten: ${name} neu` })).toBeVisible();
  // Die Bearbeitung bleibt offen und bestätigt; von dort geht es zum Löschen.
  await expect(page.getByRole('status').filter({ hasText: 'Umbenannt.' })).toBeVisible();

  await page.getByRole('button', { name: 'Projekt löschen …' }).click();
  await page.getByRole('button', { name: 'Projekt löschen', exact: true }).click();
  await expect(page.getByRole('button', { name: `Bearbeiten: ${name} neu` })).toHaveCount(0);
});

test('eine fremde Projekt-ID fällt still auf alle Dokumente zurück', async ({ page }) => {
  await page.goto(`/app/chat?projekt=${randomUUID()}`);
  // Keine Fehlermeldung, die verriete, ob es die ID gibt.
  await expect(page.getByText(/gibt es nicht/)).toHaveCount(0);
  await expect(page.locator('main')).toBeVisible();
});

test.describe('ohne Bewegung', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  for (const pfad of SEITEN) {
    for (const thema of ['dark', 'light'] as const) {
      test(`axe ohne Befund auf ${pfad}, ${thema}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: thema, reducedMotion: 'reduce' });
        await page.goto(pfad);
        await expect(page).toHaveURL(new RegExp(`${pfad}$`));
        await page.evaluate(() => document.fonts.ready);

        const ergebnis = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        const befunde = ergebnis.violations.map(
          (v) =>
            `${v.id}: ${v.nodes.map((n) => `${n.target.join(' ')} (${n.any.map((a) => a.message).join('; ')})`).join(', ')}`,
        );
        expect(befunde).toEqual([]);
      });
    }
  }
});

for (const pfad of SEITEN) {
  test(`passt am Schreibtisch auf einen Bildschirm: ${pfad}`, async ({ page }) => {
    // Adam, 22.09.2026: angemeldet nie scrollen müssen. Schmal fliesst die Seite.
    test.skip((page.viewportSize()?.width ?? 0) < 1024, 'Schmal fliesst die Seite');
    await page.goto(pfad);
    const { seite, fenster } = await page.evaluate(() => ({
      seite: document.documentElement.scrollHeight,
      fenster: window.innerHeight,
    }));
    expect(seite).toBeLessThanOrEqual(fenster);
  });

  test(`kein Querscrollen und keine Schrift unter 16 px auf ${pfad}`, async ({ page }) => {
    await page.goto(pfad);
    const { ueberbreit, zuKlein } = await page.evaluate(() => {
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
      return {
        ueberbreit: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        zuKlein: treffer,
      };
    });
    expect(ueberbreit).toBe(false);
    expect(zuKlein).toEqual([]);
  });
}
