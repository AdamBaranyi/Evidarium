import { z } from 'zod';

/*
 * Das Format, in dem das Modell antworten muss.
 *
 * Es ist bewusst eng: Jede Aussage trägt ihre Belege bei sich, statt dass am
 * Ende eine Quellenliste steht. Nur so lässt sich prüfen, ob **dieser** Satz
 * durch **diese** Stelle gedeckt ist — eine Sammelliste am Schluss liesse sich
 * nicht zuordnen und wäre damit nicht prüfbar.
 */

/**
 * Die Kategorien sind Urteile, keine Wahrscheinlichkeiten. «97 % sicher» wäre
 * eine erfundene Zahl; ob etwas belegt ist, ist eine Ja-Nein-Frage je Aussage.
 */
export const Kategorie = z.enum(['belegt', 'teilweise_belegt', 'keine_grundlage', 'widerspruch']);
export type Kategorie = z.infer<typeof Kategorie>;

export const Beleg = z.object({
  /**
   * Muss aus der Menge stammen, die dem Modell tatsächlich übermittelt wurde.
   * Eine erfundene ID ist der häufigste Weg, auf dem eine plausible Antwort
   * an eine falsche Stelle geheftet wird.
   */
  sourceId: z.string().min(1),

  /**
   * Wörtlich aus dem Abschnitt. Kurz halten — der Server prüft, ob es dort
   * wirklich steht, und lange Zitate scheitern an jeder Kleinigkeit.
   */
  zitat: z.string().min(1).max(400),
});
export type Beleg = z.infer<typeof Beleg>;

export const Aussage = z.object({
  text: z.string().min(1).max(2000),
  belege: z.array(Beleg).max(4),
});
export type Aussage = z.infer<typeof Aussage>;

export const Modellantwort = z.object({
  kategorie: Kategorie,
  aussagen: z.array(Aussage).max(12),
});
export type Modellantwort = z.infer<typeof Modellantwort>;

/*
 * Kein `Dateiname`, keine `Seite`, keine `URL` in diesem Schema — und das ist
 * Absicht.
 *
 * Diese Angaben ergänzt der Server aus der `sourceId`. Dürfte das Modell sie
 * selbst setzen, könnte es zu einem echten Abschnitt eine falsche Seitenzahl
 * schreiben, und die Antwort sähe vollkommen glaubwürdig aus.
 */
