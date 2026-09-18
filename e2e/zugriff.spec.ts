import { expect, test } from '@playwright/test';

/*
 * Zugriffsgrenzen am **echten Endpunkt**, nicht an der Funktion darunter.
 *
 * Ein Test, der die Bibliothek aufruft, beweist nur, dass die Bibliothek
 * prüft. Die Abnahmeliste verlangt ausdrücklich, dass es auch «bei direktem
 * API-Aufruf» hält — also ohne Browseroberfläche, ohne Anmeldung, mit
 * selbst gesetzten Köpfen.
 */

const HERKUNFT = 'http://localhost:3100';

test('ohne Anmeldung kein Upload', async ({ request }) => {
  const antwort = await request.post('/api/documents', {
    headers: { origin: HERKUNFT },
    multipart: {
      datei: {
        name: 'schmuggel.md',
        mimeType: 'text/markdown',
        buffer: Buffer.from('# Test\n\nInhalt.\n'),
      },
    },
  });
  expect(antwort.status()).toBe(401);
});

test('ohne Anmeldung keine Frage an fremde Dokumente', async ({ request }) => {
  const antwort = await request.post('/api/chat', {
    headers: { origin: HERKUNFT, 'content-type': 'application/json' },
    data: {
      frage: 'Wer hilft beim Onboarding?',
      documentIds: ['00000000-0000-4000-8000-000000000000'],
    },
  });
  expect(antwort.status()).toBe(401);
});

test('ohne passende Herkunft gar nichts', async ({ request }) => {
  /*
   * Die Herkunftsprüfung ist die zweite Schranke neben der Anmeldung. Sie
   * greift **vor** ihr: Eine Anfrage von fremder Seite wird abgelehnt, ohne
   * dass überhaupt eine Sitzung nachgeschlagen wird.
   */
  const antwort = await request.post('/api/chat', {
    headers: { origin: 'https://boese.example', 'content-type': 'application/json' },
    data: { frage: 'Hallo', documentIds: ['00000000-0000-4000-8000-000000000000'] },
  });
  expect(antwort.status()).toBe(403);
});

test('geschützte Seiten führen zur Anmeldung', async ({ page }) => {
  await page.goto('/app/documents');
  await expect(page).toHaveURL(/\/login$/);

  await page.goto('/app/usage');
  await expect(page).toHaveURL(/\/login$/);
});
