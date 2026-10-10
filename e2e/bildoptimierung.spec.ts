import { expect, test } from '@playwright/test';

/*
 * Die Anwendung nutzt `next/image` nicht. Die Bildoptimierung von Next ist
 * darum abgeschaltet (`images.unoptimized` in next.config.ts): Ein Endpunkt,
 * den niemand braucht, ist nur Angriffsfläche — im Oktober 2026 kam mit
 * GHSA-cjq9-62q9-8jv4 eine SSRF genau dort. Abgeschaltet antwortet er mit
 * 404, bevor er irgendein Bild holt.
 */
test('die Bildoptimierung von Next ist aus', async ({ request }) => {
  const antwort = await request.get('/_next/image?url=%2Fopengraph-image.png&w=64&q=75');

  expect(antwort.status()).toBe(404);
});
