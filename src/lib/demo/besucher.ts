import { createHash, randomBytes } from 'node:crypto';

/*
 * Eine Kennung für den Besuch, nicht für die Person.
 *
 * Sie dient allein dem Kontingent von zehn Fragen. Kein Name, keine Adresse,
 * keine Verknüpfung über Besuche hinweg — und weil sie serverseitig erzeugt
 * wird, lässt sie sich nicht als Zähler fälschen.
 *
 * **Sie ist bewusst leicht zu umgehen:** Wer die Cookies löscht, fängt von
 * vorne an. Das ist in Ordnung, denn die Schranke, die wirklich hält, ist der
 * Tagesdeckel in Dollar. Eine schwer zu umgehende Besuchererkennung wäre
 * Fingerprinting — teuer, aufdringlich und für den Zweck unnötig.
 */

export const DEMO_COOKIE = 'evidarium_demo';
const GUELTIGKEIT_TAGE = 30;

export function neueBesucherkennung(): string {
  return randomBytes(24).toString('base64url');
}

/** Wie bei der Anmeldung: Gespeichert wird der Hash, nie der Wert im Cookie. */
export function besucherKennung(wert: string): string {
  return `demo:${createHash('sha256').update(wert).digest('hex').slice(0, 32)}`;
}

export function cookieKopf(wert: string, sicher: boolean): string {
  const teile = [
    `${DEMO_COOKIE}=${wert}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${GUELTIGKEIT_TAGE * 24 * 60 * 60}`,
  ];
  if (sicher) teile.push('Secure');
  return teile.join('; ');
}
