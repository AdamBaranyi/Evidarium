import { defineConfig } from 'drizzle-kit';

/*
 * Migrationen laufen als Eigentümer, nicht als Anwendungsrolle: Die
 * Anwendungsrolle darf keine Tabellen anlegen, und der Eigentümer umgeht
 * Row Level Security — beides ist beabsichtigt.
 */
export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_OWNER ?? process.env.DATABASE_URL ?? '',
  },
  strict: true,
  verbose: true,
});
