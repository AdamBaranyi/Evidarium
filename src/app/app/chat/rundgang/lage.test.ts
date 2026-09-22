import { describe, expect, it } from 'vitest';
import { ausschnitt, karteSetzen, mussRollen, schneiden } from './lage';
import { schritteFuer } from './schritte';

const BILD = { width: 1440, height: 800 };
const KARTE = { width: 400, height: 240 };

describe('karteSetzen', () => {
  it('ohne Ziel mittig', () => {
    expect(karteSetzen(null, KARTE, BILD)).toEqual({ top: 280, left: 520, verdeckt: false });
  });

  it('unter dem Ziel, wenn Platz ist', () => {
    const ziel = { top: 100, left: 200, width: 300, height: 40 };
    expect(karteSetzen(ziel, KARTE, BILD)).toEqual({ top: 152, left: 200, verdeckt: false });
  });

  it('darüber, wenn unten kein Platz ist — etwa beim Eingabefeld', () => {
    const ziel = { top: 640, left: 490, width: 736, height: 100 };
    expect(karteSetzen(ziel, KARTE, BILD)).toEqual({ top: 388, left: 490, verdeckt: false });
  });

  it('rechts daneben bei hohen, schmalen Zielen wie der Seitenspalte', () => {
    const ziel = { top: 150, left: 170, width: 280, height: 600 };
    expect(karteSetzen(ziel, KARTE, BILD)).toEqual({ top: 150, left: 462, verdeckt: false });
  });

  it('meldet, wenn nichts passt und die Karte das Ziel verdeckt', () => {
    const schmal = { width: 320, height: 568 };
    const ziel = { top: 60, left: 10, width: 300, height: 480 };
    const platz = karteSetzen(ziel, { width: 296, height: 300 }, schmal);
    expect(platz.verdeckt).toBe(true);
    expect(platz.left).toBeGreaterThanOrEqual(12);
  });

  it('geht bei 320 Pixeln nach oben, wenn das Ziel unten liegt', () => {
    const legende = { top: 421, left: 28, width: 263, height: 147 };
    const platz = karteSetzen(legende, { width: 296, height: 404 }, { width: 320, height: 568 });
    expect(platz).toEqual({ top: 12, left: 12, verdeckt: false });
  });

  it('bleibt im Bild, auch wenn das Ziel unter dem Bildrand liegt', () => {
    const ziel = { top: 655, left: 22, width: 276, height: 12 };
    const platz = karteSetzen(ziel, { width: 296, height: 404 }, { width: 320, height: 568 });
    expect(platz.top + 404).toBeLessThanOrEqual(568 - 12);
  });

  it('bleibt links im Bild', () => {
    const ziel = { top: 100, left: 1300, width: 100, height: 40 };
    expect(karteSetzen(ziel, KARTE, BILD).left).toBe(1440 - 400 - 12);
  });
});

describe('ausschnitt', () => {
  it('legt Polster um das Ziel und beschneidet am Bildrand', () => {
    expect(ausschnitt({ top: 2, left: 2, width: 100, height: 50 }, BILD)).toEqual({
      top: 0,
      left: 0,
      width: 108,
      height: 58,
    });
  });
});

describe('schritteFuer', () => {
  it('lässt Schritte weg, deren Element fehlt', () => {
    const ohneVorschlaege = schritteFuer('demo', (ziel) => ziel !== 'vorschlaege');
    expect(ohneVorschlaege.map((s) => s.id)).not.toContain('vorschlaege');
    expect(ohneVorschlaege[0]?.id).toBe('willkommenDemo');
    expect(ohneVorschlaege.at(-1)?.id).toBe('ende');
  });

  it('zeigt in Demo und Anwendung je sechs Schritte, wenn alles da ist', () => {
    expect(schritteFuer('demo', () => true)).toHaveLength(6);
    expect(schritteFuer('app', () => true)).toHaveLength(6);
  });

  it('erklärt mitten im Gespräch das Eingabefeld statt der Einstiegsfragen', () => {
    const imGespraech = schritteFuer('demo', (ziel) => ['eingabe', 'urteil'].includes(ziel));
    expect(imGespraech.map((s) => s.id)).toEqual([
      'willkommenDemo',
      'korpus',
      'fragen',
      'urteile',
      'ende',
    ]);
  });
});

describe('mussRollen', () => {
  const ganz = { top: 400, left: 0, width: 500, height: 50 };

  it('rollt ein kleines Ziel herein, das nicht ganz zu sehen ist', () => {
    expect(mussRollen(ganz, { ...ganz, height: 30 })).toBe(true);
    expect(mussRollen(ganz, { ...ganz, height: 0 })).toBe(true);
    expect(mussRollen(ganz, ganz)).toBe(false);
  });

  it('lässt eine lange Liste stehen, deren Anfang zu sehen ist', () => {
    const liste = { top: 300, left: 0, width: 500, height: 400 };
    expect(mussRollen(liste, { ...liste, height: 160 })).toBe(false);
    expect(mussRollen(liste, { ...liste, height: 40 })).toBe(true);
  });
});

describe('schneiden', () => {
  it('kürzt ein Ziel auf den sichtbaren Teil des Verlaufs', () => {
    const liste = { top: 300, left: 250, width: 500, height: 400 };
    const verlauf = { top: 130, left: 240, width: 530, height: 330 };
    expect(schneiden(liste, verlauf)).toEqual({ top: 300, left: 250, width: 500, height: 160 });
  });

  it('ist leer, wenn sich nichts überlappt', () => {
    const a = { top: 0, left: 0, width: 10, height: 10 };
    const b = { top: 50, left: 50, width: 10, height: 10 };
    expect(schneiden(a, b)).toEqual({ top: 50, left: 50, width: 0, height: 0 });
  });
});
