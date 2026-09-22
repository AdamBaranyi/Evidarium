import { randomBytes, randomUUID } from 'node:crypto';
import type { BrowserContext } from '@playwright/test';
import { Pool } from 'pg';

/*
 * Ein Testkonto für den angemeldeten Bereich.
 *
 * Die Sitzung entsteht direkt in der Datenbank, nicht über das
 * Anmeldeformular: Ein Passwort im Test wäre ein Passwort im Repository. Das
 * Konto trägt als Hash eine Zeichenkette, die kein Argon2-Hash ist — mit ihm
 * kann sich niemand anmelden, auch nicht mit dem richtigen Raten.
 */

const SESSION_COOKIE = 'evidarium_session';

export type Konto = { pool: Pool; nutzerId: string; sitzung: string };

export async function kontoAnlegen(url: string): Promise<Konto> {
  const pool = new Pool({ connectionString: url });
  const nutzer = await pool.query<{ id: string }>(
    `insert into users (email, password_hash) values ($1, 'kein-passwort') returning id`,
    [`e2e-${randomUUID()}@evidarium.test`],
  );
  const nutzerId = nutzer.rows[0]?.id ?? '';
  const sitzung = randomBytes(32).toString('base64url');
  await pool.query(
    `insert into sessions (id, user_id, expires_at) values ($1, $2, now() + interval '1 hour')`,
    [sitzung, nutzerId],
  );
  return { pool, nutzerId, sitzung };
}

// Sitzung, Dokumente und Projekte hängen per Fremdschlüssel am Konto und gehen mit.
export async function kontoEntfernen(konto: Konto | undefined): Promise<void> {
  if (!konto) return;
  if (konto.nutzerId) await konto.pool.query('delete from users where id = $1', [konto.nutzerId]);
  await konto.pool.end();
}

export async function anmelden(context: BrowserContext, konto: Konto, url: string): Promise<void> {
  await context.addCookies([
    { name: SESSION_COOKIE, value: konto.sitzung, url, httpOnly: true, sameSite: 'Lax' },
  ]);
}

/*
 * Ein Dokument, das als fertig verarbeitet gilt, aber keine Abschnitte hat:
 * genug, damit der Chat Eingabefeld und Legende zeigt. Eine Frage fände
 * darin nichts — dafür gibt es die Demo.
 */
export async function fertigesDokument(konto: Konto, dateiname: string): Promise<void> {
  const dokument = await konto.pool.query<{ id: string }>(
    `insert into documents (user_id, filename, kind, size_bytes, content_hash, storage_path)
     values ($1, $2, 'text', 1, $3, 'e2e/nirgends') returning id`,
    [konto.nutzerId, dateiname, randomUUID()],
  );
  await konto.pool.query(
    `insert into document_versions (document_id, parser_version, chunker_version, status, chunk_count)
     values ($1, 'e2e', 'e2e', 'ready', 0)`,
    [dokument.rows[0]?.id],
  );
}
