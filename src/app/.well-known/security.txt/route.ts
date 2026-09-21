import { env } from '@/lib/config/env';

/*
 * `security.txt` nach RFC 9116: wohin Sicherheitslücken gemeldet werden.
 *
 * **`Expires` ist ein festes Datum und muss jährlich erneuert werden.** Ein
 * zur Laufzeit berechnetes «heute plus ein Jahr» liefe nie ab — und genau das
 * Ablaufen ist der Sinn des Feldes: Es zwingt dazu, die Angaben regelmässig zu
 * prüfen. Nächste Erneuerung: vor dem 21.09.2027 (steht in docs/BETRIEB.md).
 *
 * Ohne gesetzte Kontaktadresse gibt es keine Datei. Eine `security.txt` mit
 * falscher oder leerer Adresse wäre schlechter als keine.
 */

const GUELTIG_BIS = '2027-09-21T00:00:00.000Z';

export const dynamic = 'force-dynamic';

export function GET(): Response {
  if (!env.BETREIBER_EMAIL) return new Response('Nicht gesetzt.', { status: 404 });

  const text = [
    `Contact: mailto:${env.BETREIBER_EMAIL}`,
    `Expires: ${GUELTIG_BIS}`,
    'Preferred-Languages: de, en',
    `Canonical: ${env.APP_ORIGIN}/.well-known/security.txt`,
    '',
  ].join('\n');

  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
