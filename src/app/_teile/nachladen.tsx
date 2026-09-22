'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Lädt den Stand der Seite nach, solange etwas in Arbeit ist — sonst stünde
 * «Wartet auf Verarbeitung» da, bis jemand selbst neu lädt. Zeigt nichts an.
 */
export function Nachladen({ aktiv, alleMs = 2000 }: { aktiv: boolean; alleMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    if (!aktiv) return;
    const takt = setInterval(() => router.refresh(), alleMs);
    return () => clearInterval(takt);
  }, [aktiv, alleMs, router]);

  return null;
}
