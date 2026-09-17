import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/session';

/*
 * In Next 16 heisst diese Datei `proxy.ts`, nicht mehr `middleware.ts`.
 *
 * Hier wird nur auf das Vorhandensein des Cookies geprüft — der Proxy läuft
 * in einer Umgebung ohne Datenbankzugriff. Ob die Sitzung gültig ist,
 * entscheidet die Seite selbst.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.get(SESSION_COOKIE)) {
    const ziel = new URL('/login', request.url);
    return NextResponse.redirect(ziel);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/app/:path*'] };
