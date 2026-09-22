import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { aushandeln, istSprache, SPRACH_COOKIE, type Sprache } from './sprachen';

/*
 * Nur auf dem Server: `next/headers` bricht im Browser ohnehin. Das Paket
 * `server-only` bräuchte es dafür nicht — ein neues Paket nur für diese Zeile
 * wäre eine Abhängigkeit mehr ohne Gewinn.
 */

/**
 * Die Sprache der laufenden Anfrage: zuerst die eigene Wahl (Cookie), sonst
 * die Wünsche des Browsers. Je Anfrage einmal ermittelt.
 */
export const sprache = cache(async (): Promise<Sprache> => {
  const gewaehlt = (await cookies()).get(SPRACH_COOKIE)?.value;
  if (istSprache(gewaehlt)) return gewaehlt;
  return aushandeln((await headers()).get('accept-language'));
});
