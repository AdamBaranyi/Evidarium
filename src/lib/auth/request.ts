import { headers } from 'next/headers';
import { env } from '@/lib/config/env';

/*
 * Hinter einem Reverse Proxy ist die Verbindungsadresse die des Proxys —
 * jeder Anmeldeversuch bekäme denselben Schlüssel und das Rate-Limit griffe
 * nie. Das linkeste X-Forwarded-For gilt nur, wenn der eigene Proxy den
 * Client-Wert überschreibt; deshalb ist es eine ausdrückliche Einstellung
 * und kein Automatismus.
 */
export async function clientHerkunft(): Promise<string> {
  const h = await headers();
  if (env.TRUST_PROXY) {
    const weitergeleitet = h.get('x-forwarded-for');
    const erste = weitergeleitet?.split(',')[0]?.trim();
    if (erste) return erste;
  }
  return h.get('x-real-ip') ?? 'unbekannt';
}

/**
 * Prüft, dass die Anfrage von der eigenen Herkunft stammt. Next prüft das bei
 * Server Actions bereits selbst; diese Prüfung ist die zweite Schranke und
 * gilt auch für Route Handler.
 */
export async function herkunftStimmt(): Promise<boolean> {
  const h = await headers();
  const origin = h.get('origin');
  if (!origin) return false;
  return origin === env.APP_ORIGIN;
}
