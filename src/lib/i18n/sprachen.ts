/*
 * **Die Sprachen der Oberfläche** — Deutsch, Französisch, Italienisch,
 * Englisch, wie bei Tallyroom (E42).
 *
 * Diese Datei kennt weder Server noch Browser; beide binden sie ein.
 */

export const SPRACHEN = ['de', 'fr', 'it', 'en'] as const;
export type Sprache = (typeof SPRACHEN)[number];
export const STANDARD_SPRACHE: Sprache = 'de';

/** Die Wahl bleibt ein Jahr. Nur die Kennung, zwei Buchstaben. */
export const SPRACH_COOKIE = 'evidarium_sprache';
export const SPRACH_COOKIE_TAGE = 365;

/** Jede Sprache heisst in sich selbst — wer sie sucht, liest sie so. */
export const SPRACHNAME: Record<Sprache, string> = {
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  en: 'English',
};

export function istSprache(wert: unknown): wert is Sprache {
  return typeof wert === 'string' && (SPRACHEN as readonly string[]).includes(wert);
}

/**
 * Die erste unterstützte Sprache aus einem Accept-Language-Kopf, in der
 * Reihenfolge der Gewichte. Ohne passenden Wunsch gilt Deutsch.
 */
export function aushandeln(kopf: string | null | undefined): Sprache {
  const wuensche = (kopf ?? '')
    .split(',')
    .map((teil, stelle) => {
      const [code = '', ...parameter] = teil.trim().split(';');
      const q = parameter.map((p) => p.trim()).find((p) => p.startsWith('q='));
      const gewicht = q ? Number(q.slice(2)) : 1;
      return { basis: code.toLowerCase().split('-')[0], gewicht, stelle };
    })
    .filter((w) => Number.isFinite(w.gewicht) && w.gewicht > 0)
    .sort((a, b) => b.gewicht - a.gewicht || a.stelle - b.stelle);

  for (const wunsch of wuensche) {
    if (istSprache(wunsch.basis)) return wunsch.basis;
  }
  return STANDARD_SPRACHE;
}

/** Für `lang` und `Intl`: Formate bleiben schweizerisch, auch auf Englisch. */
export function sprachTag(sprache: Sprache): string {
  return `${sprache}-CH`;
}
