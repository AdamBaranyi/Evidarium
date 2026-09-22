import { afterEach, describe, expect, it, vi } from 'vitest';

/*
 * Bricht der Browser eine Antwort ab, darf der Strom danach nichts mehr
 * schreiben — und das Log keinen «unerwarteten Fehler» melden, wo nur
 * jemand weitergeklickt hat.
 */

let weiter: () => void = () => {};

vi.mock('@/lib/antwort/fragen', () => ({
  frageBeantworten: async ({ melden }: { melden: (phase: string) => void }) => {
    melden('suchen');
    await new Promise<void>((fertig) => {
      weiter = fertig;
    });
    melden('antworten');
    return { art: 'fehler', code: 'unerwartet', nachricht: 'egal' };
  },
}));

const { ndjsonAntwort } = await import('@/lib/antwort/strom');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ndjsonAntwort', () => {
  it('schreibt nach dem Abbruch nichts mehr und meldet keinen Fehler', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const antwort = ndjsonAntwort({ frage: 'x' } as never);
    const leser = antwort.body!.getReader();

    const erste = await leser.read();
    expect(new TextDecoder().decode(erste.value)).toContain('"phase":"suchen"');

    await leser.cancel();
    weiter();
    await new Promise((fertig) => setTimeout(fertig, 10));

    expect(log).not.toHaveBeenCalled();
  });
});
