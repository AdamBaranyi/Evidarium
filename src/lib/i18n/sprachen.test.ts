import { describe, expect, it } from 'vitest';
import { aushandeln, istSprache } from './sprachen';

describe('aushandeln', () => {
  it('nimmt die erste unterstützte Sprache nach Gewicht', () => {
    expect(aushandeln('fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7')).toBe('fr');
    expect(aushandeln('es-ES, it;q=0.5, en;q=0.9')).toBe('en');
    expect(aushandeln('en-US;q=0.2, it-CH')).toBe('it');
  });

  it('fällt ohne passenden Wunsch auf Deutsch zurück', () => {
    expect(aushandeln('es-ES, ja;q=0.8')).toBe('de');
    expect(aushandeln('')).toBe('de');
    expect(aushandeln(null)).toBe('de');
  });

  it('übergeht Einträge mit Gewicht null oder Unsinn', () => {
    expect(aushandeln('en;q=0, fr')).toBe('fr');
    expect(aushandeln('en;q=abc, it')).toBe('it');
  });
});

describe('istSprache', () => {
  it('kennt genau die vier Sprachen', () => {
    expect(['de', 'fr', 'it', 'en'].every(istSprache)).toBe(true);
    expect(istSprache('es')).toBe(false);
    expect(istSprache('DE')).toBe(false);
    expect(istSprache(undefined)).toBe(false);
  });
});
