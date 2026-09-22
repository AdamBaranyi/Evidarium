import type { Sprache } from './sprachen';

/*
 * **Textkataloge**, gleich gebaut wie bei Tallyroom: je Bereich eine Datei,
 * alle Sprachen nebeneinander. Deutsch gibt die Form vor. Fehlt in einer
 * anderen Sprache ein Schlüssel, ist einer zu viel oder hat ein Text mit
 * Platzhaltern andere Parameter, bricht der Typecheck — nicht erst die
 * Anzeige.
 */

export type Form<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => R extends string ? string : R
    : T[K] extends string
      ? string
      : T[K] extends readonly unknown[]
        ? T[K]
        : Form<T[K]>;
};

export type Katalog<T> = Record<Sprache, Form<T>>;

export function texte<T extends object>(
  kataloge: { de: T } & Record<Exclude<Sprache, 'de'>, Form<T>>,
): Katalog<T> {
  return kataloge as Katalog<T>;
}
