import { expect, test } from '@playwright/test';

/*
 * Die Content Security Policy im echten Browser — und die Zusage «keine
 * Anfragen an Dritte».
 *
 * Eine Richtlinie im Kopf beweist nichts. Erst wenn der Browser jede Seite
 * damit lädt und kein einziges `securitypolicyviolation`-Ereignis auslöst,
 * ist sie gleichzeitig **streng und passend**. Zu streng hiesse: Die Seite
 * bricht still, weil ein eigenes Skript blockiert wird. So stand es als
 * Regel in `wissen-sicherheit`, und so wird es hier geprüft.
 */

const SEITEN = [
  '/',
  '/login',
  '/demo',
  '/impressum',
  '/datenschutz',
  '/barrierefreiheit',
  '/gibt-es-nicht',
];

for (const pfad of SEITEN) {
  test(`keine CSP-Verstösse und keine fremden Anfragen auf ${pfad}`, async ({ page, baseURL }) => {
    const eigene = new URL(baseURL ?? 'http://localhost:3100').host;
    const fremde: string[] = [];
    page.on('request', (anfrage) => {
      const host = new URL(anfrage.url()).host;
      if (host !== eigene && !anfrage.url().startsWith('data:')) fremde.push(anfrage.url());
    });

    // Vor dem Laden anmelden, sonst entgehen Verstösse beim ersten Rendern.
    await page.addInitScript(() => {
      (window as unknown as { verstoesse: string[] }).verstoesse = [];
      document.addEventListener('securitypolicyviolation', (e) => {
        (window as unknown as { verstoesse: string[] }).verstoesse.push(
          `${e.violatedDirective}: ${e.blockedURI}`,
        );
      });
    });

    const antwort = await page.goto(pfad);
    await page.waitForLoadState('networkidle');
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(300);

    const csp = antwort?.headers()['content-security-policy'] ?? '';
    expect(csp, 'Richtlinie fehlt').toContain("default-src 'self'");
    expect(csp, 'Skripte dürfen nicht inline laufen').not.toMatch(/script-src[^;]*'unsafe-inline'/);

    const verstoesse = await page.evaluate(
      () => (window as unknown as { verstoesse: string[] }).verstoesse,
    );
    expect(verstoesse, `CSP-Verstösse auf ${pfad}`).toEqual([]);
    expect(fremde, `Anfragen an Dritte auf ${pfad}`).toEqual([]);
  });
}

test('die Richtlinie blockiert eingeschleustes HTML — Gegenprobe', async ({ page }) => {
  /*
   * Ohne diese Gegenprobe könnte die leere Liste oben auch heissen, dass der
   * Zuhörer nie etwas hört.
   *
   * Eingeschleust wird, was ein echter Angriff tut: HTML mit einem
   * Ereignis-Handler, über `innerHTML`. Die erste Fassung dieser Probe legte
   * stattdessen ein `<script>` per `createElement` an — das lief, aber nicht
   * wegen einer Lücke: `page.evaluate` hat Sonderrechte der
   * Entwicklerschnittstelle, und `'strict-dynamic'` vertraut Skripten, die
   * ein bereits vertrautes Skript selbst anlegt. Das prüfte die Probe, nicht
   * die Richtlinie.
   */
  await page.addInitScript(() => {
    (window as unknown as { verstoesse: string[] }).verstoesse = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      (window as unknown as { verstoesse: string[] }).verstoesse.push(e.violatedDirective);
    });
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const gelaufen = await page.evaluate(async () => {
    const huelle = document.createElement('div');
    huelle.innerHTML = '<img src="data:," onerror="window.eingeschleust = true">';
    document.body.appendChild(huelle);
    await new Promise((weiter) => setTimeout(weiter, 200));
    return (window as unknown as { eingeschleust?: boolean }).eingeschleust === true;
  });

  const verstoesse = await page.evaluate(
    () => (window as unknown as { verstoesse: string[] }).verstoesse,
  );
  expect(gelaufen, 'Der eingeschleuste Handler darf nicht laufen').toBe(false);
  expect(verstoesse.length, 'Der Verstoss muss gemeldet werden').toBeGreaterThan(0);
});
