/**
 * Entfernt den Dateinamen, den die Zerlegung jedem Abschnitt voranstellt.
 *
 * Der Vorsatz steht dort mit Absicht: Er verbessert die Suche, weil der
 * Dokumentname mit im Vektor und im Volltext liegt. **Angezeigt** gehört er
 * nicht — im Quellen-Panel steht der Dateiname bereits im Kopf, und
 * darunter noch einmal sieht wie ein Fehler aus.
 *
 * Gespeichert bleibt der Text unverändert; entfernt wird nur fürs Anzeigen.
 */
export function ohneDateinamensvorsatz(text: string, dateiname: string): string {
  const vorsatz = `${dateiname}\n`;
  if (!text.startsWith(vorsatz)) return text;
  return text.slice(vorsatz.length).replace(/^\s+/, '');
}
