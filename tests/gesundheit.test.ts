import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/gesundheit/route';
import { db } from '@/lib/db';

/*
 * Der Gesundheitsendpunkt entscheidet, ob Docker einen Container für gesund
 * hält und ob das Deploy-Skript weitermacht. Er muss darum auch sagen
 * können, wenn etwas nicht stimmt — und dabei nichts verraten.
 */
afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/gesundheit', () => {
  it('meldet gesund, wenn die Datenbank antwortet', async () => {
    const antwort = await GET();
    expect(antwort.status).toBe(200);
    expect(await antwort.json()).toEqual({ ok: true });
    expect(antwort.headers.get('cache-control')).toBe('no-store');
  });

  it('meldet 503 ohne Einzelheiten, wenn die Datenbank fehlt', async () => {
    vi.spyOn(db, 'execute').mockRejectedValueOnce(new Error('connect ECONNREFUSED 10.0.0.5:5432'));
    const antwort = await GET();
    expect(antwort.status).toBe(503);
    const text = await antwort.text();
    expect(text).toBe('{"ok":false}');
  });
});
