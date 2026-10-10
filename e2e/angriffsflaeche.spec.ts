import { expect, test } from '@playwright/test';

/*
 * Was der Next-Server von sich aus anbietet, ohne dass die Anwendung es
 * braucht, ist nur Angriffsfläche. Beides ist in next.config.ts abgeschaltet.
 */

/*
 * Die Anwendung nutzt `next/image` nicht. Mit eingeschalteter Bildoptimierung
 * beantwortete der Server `/_next/image` trotzdem und holte dafür Bilder — im
 * Oktober 2026 kam mit GHSA-cjq9-62q9-8jv4 eine SSRF genau dort. Abgeschaltet
 * antwortet er mit 404, bevor er irgendein Bild holt.
 */
test('die Bildoptimierung von Next ist aus', async ({ request }) => {
  const antwort = await request.get('/_next/image?url=%2Fopengraph-image.png&w=64&q=75');

  expect(antwort.status()).toBe(404);
});

// Ein Kopf, der Framework und Fassung verrät, erspart einem Angreifer die Suche.
test('der Server nennt sein Framework nicht', async ({ request }) => {
  const antwort = await request.get('/');

  expect(antwort.headers()['x-powered-by']).toBeUndefined();
});
