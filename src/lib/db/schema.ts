import { sql } from 'drizzle-orm';
import { check, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/*
 * Tag 1: nur, was die Anmeldung braucht. Dokumente, Abschnitte, Vektoren und
 * Läufe kommen an den Tagen 2 bis 4 dazu.
 *
 * CHECK statt nativer Enums: Wertemengen wachsen, und ein ALTER COLUMN TYPE
 * auf einer befüllten Spalte bleibt so erspart.
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check('users_status_gueltig', sql`${table.status} IN ('active', 'disabled')`)],
);

/*
 * Sitzungen liegen serverseitig. Das Cookie trägt nur die ID; wer abmeldet,
 * löscht die Zeile, und ein gestohlenes Cookie lässt sich entwerten.
 */
export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('sessions_user_idx').on(table.userId)],
);

/*
 * Rate-Limit-Zähler in der Datenbank, nicht im Prozess: Hinter einem Proxy
 * teilen sich alle Anfragen eine IP, und ein Zähler im Speicher überlebt
 * weder einen Neustart noch eine zweite Instanz.
 *
 * Gespeichert wird nur ein Hash der Herkunft, nie die IP selbst.
 */
export const loginAttempts = pgTable(
  'login_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    originHash: text('origin_hash').notNull(),
    attemptedAt: timestamp('attempted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('login_attempts_lookup_idx').on(table.originHash, table.attemptedAt)],
);
