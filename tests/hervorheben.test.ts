import { describe, expect, it } from 'vitest';
import { zitatTeile } from '@/lib/antwort/hervorheben';
import { ohneDateinamensvorsatz } from '@/lib/documents/anzeigetext';

/*
 * Die Markierung im Quellen-Panel muss dieselbe Toleranz haben wie die
 * Belegprüfung — sonst besteht ein Zitat die Prüfung und lässt sich im
 * Abschnitt trotzdem nicht zeigen. Das sähe für die lesende Person wie ein
 * Widerspruch aus.
 */

describe('Zitat im Abschnitt finden', () => {
  it('findet das wörtliche Zitat', () => {
    const teile = zitatTeile('Vorher. Der Satz steht hier. Nachher.', 'Der Satz steht hier.');
    expect(teile?.treffer).toBe('Der Satz steht hier.');
    expect(teile?.vor).toBe('Vorher. ');
    expect(teile?.nach).toBe(' Nachher.');
  });

  it('findet ein Zitat über einen Zeilenumbruch hinweg', () => {
    // Genau das erzeugt die PDF-Extraktion an jedem Zeilenende.
    const abschnitt = 'Zugaenge werden vor dem\nersten Arbeitstag vorbereitet.';
    const teile = zitatTeile(abschnitt, 'Zugaenge werden vor dem ersten Arbeitstag vorbereitet.');
    expect(teile?.treffer).toBe(abschnitt);
  });

  it('gleicht typografische Anführungszeichen an', () => {
    const teile = zitatTeile('Er sagte „Hallo“ zum Team.', 'sagte "Hallo" zum');
    expect(teile?.treffer).toBe('sagte „Hallo“ zum');
  });

  it('gleicht Gedankenstriche an', () => {
    const teile = zitatTeile('Montag–Freitag offen', 'Montag-Freitag');
    expect(teile?.treffer).toBe('Montag–Freitag');
  });

  it('markiert nicht, wenn das Zitat nicht dasteht', () => {
    expect(zitatTeile('Hier steht etwas anderes.', 'Der Satz steht hier.')).toBeNull();
  });

  it('achtet auf Gross- und Kleinschreibung', () => {
    // Dieselbe Strenge wie die Belegprüfung: kein Kleinschreib-Vergleich.
    expect(zitatTeile('Der Satz steht hier.', 'der satz steht hier.')).toBeNull();
  });

  it('behandelt regulaere Ausdruecke im Zitat als Text', () => {
    const teile = zitatTeile('Kosten (netto) 12.50', '(netto) 12.50');
    expect(teile?.treffer).toBe('(netto) 12.50');
  });

  it('gibt bei leerem Zitat nichts zurueck', () => {
    expect(zitatTeile('Irgendein Text', '   ')).toBeNull();
  });
});

describe('Dateinamensvorsatz', () => {
  it('entfernt den vorangestellten Dateinamen fürs Anzeigen', () => {
    const text = 'Teamhandbuch.pdf\n\nBeim Onboarding hilft Mara Keller.';
    expect(ohneDateinamensvorsatz(text, 'Teamhandbuch.pdf')).toBe(
      'Beim Onboarding hilft Mara Keller.',
    );
  });

  it('lässt einen Abschnitt ohne Vorsatz unberührt', () => {
    const text = 'Beim Onboarding hilft Mara Keller.';
    expect(ohneDateinamensvorsatz(text, 'Teamhandbuch.pdf')).toBe(text);
  });

  it('entfernt nur den eigenen Dateinamen, nicht einen gleichlautenden Satzanfang', () => {
    const text = 'Teamhandbuch.pdf ist die Grundlage.';
    expect(ohneDateinamensvorsatz(text, 'Teamhandbuch.pdf')).toBe(text);
  });
});
