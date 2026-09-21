import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/session';

/*
 * In Next 16 heisst diese Datei `proxy.ts`, nicht mehr `middleware.ts`.
 *
 * Zwei Aufgaben:
 *
 * 1. **Content Security Policy mit Nonce.** Je Anfrage eine neue Nonce; Next
 *    liest sie aus dem Anfragekopf und setzt sie an seine eigenen Skripte.
 *    Damit braucht `script-src` kein `unsafe-inline` — ein eingeschleustes
 *    Skript ohne Nonce läuft nicht. Befund B6 im Prüfbericht.
 *
 *    Stile: Elemente nur von hier, **Stilattribute** dagegen erlaubt
 *    (`style-src-attr 'unsafe-inline'`). Die Anwendung setzt Farben und
 *    Verzögerungen über `style={…}`; ein Stilattribut kann kein Skript
 *    ausführen, und die Unterscheidung hält `<style>`-Elemente trotzdem fern.
 *
 * 2. **Anmeldung vorprüfen** unter `/app`. Hier wird nur geprüft, ob das
 *    Cookie da ist — der Proxy hat keinen Datenbankzugriff. Ob die Sitzung
 *    gilt, entscheidet die Seite selbst.
 */

function richtlinie(nonce: string): string {
  const entwicklung = process.env.NODE_ENV !== 'production';
  return [
    "default-src 'self'",
    // `unsafe-eval` nur in der Entwicklung: Fast Refresh braucht es.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${entwicklung ? " 'unsafe-eval'" : ''}`,
    "style-src 'self'",
    "style-src-elem 'self'" + (entwicklung ? " 'unsafe-inline'" : ''),
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self'${entwicklung ? ' ws:' : ''}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(entwicklung ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/app') && !request.cookies.get(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = richtlinie(nonce);

  const kopf = new Headers(request.headers);
  kopf.set('x-nonce', nonce);
  kopf.set('Content-Security-Policy', csp);

  const antwort = NextResponse.next({ request: { headers: kopf } });
  antwort.headers.set('Content-Security-Policy', csp);
  return antwort;
}

export const config = {
  matcher: [
    {
      // Alles ausser statischen Dateien; Vorabrufe brauchen keine eigene Nonce.
      source: '/((?!_next/static|_next/image|schriften/|favicon.ico|icon|apple-icon).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
