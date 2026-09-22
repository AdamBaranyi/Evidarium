'use server';

import { cookies } from 'next/headers';
import { env } from '@/lib/config/env';
import { istSprache, SPRACH_COOKIE, SPRACH_COOKIE_TAGE } from '@/lib/i18n/sprachen';

/**
 * Merkt sich die gewählte Sprache. Next zeichnet die Seite danach von selbst
 * neu — in der neuen Sprache, ohne dass sich die Adresse ändert.
 *
 * Unbekannte Werte werden still übergangen: Mehr als die vier Kennungen
 * gelangt nie in das Cookie.
 */
export async function spracheSetzen(formular: FormData): Promise<void> {
  const wahl = formular.get('sprache');
  if (!istSprache(wahl)) return;
  (await cookies()).set(SPRACH_COOKIE, wahl, {
    maxAge: SPRACH_COOKIE_TAGE * 24 * 60 * 60,
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: env.APP_ORIGIN.startsWith('https://'),
  });
}
