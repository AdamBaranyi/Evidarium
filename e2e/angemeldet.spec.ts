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
