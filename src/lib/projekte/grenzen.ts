/*
 * Grenzen und Typen der Projekte — ohne Datenbank, damit auch die
 * Oberfläche sie einbinden darf. Ein Import aus `projekte.ts` zöge den
 * Datenbanktreiber in das Bündel für den Browser.
 */

export const PROJEKT_GRENZEN = { maxJeNutzer: 50, maxNameZeichen: 60 } as const;

export type ProjektFehler = 'leer' | 'zu_lang' | 'gibt_es_schon' | 'zu_viele' | 'nicht_gefunden';

export type ProjektZeile = { id: string; name: string; anzahl: number };
