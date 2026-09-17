/*
 * Legt ein Konto an oder setzt sein Passwort neu.
 *
 * Es gibt kein öffentliches Registrierungssystem: Konten entstehen über
 * diesen Befehl, auf der Maschine, auf der die Anwendung läuft.
 *
 *   bun --env-file=.env scripts/konto-anlegen.ts adam@example.test
 *
 * Das Passwort wird erfragt und nicht als Argument übergeben — Argumente
 * landen in der Prozessliste und in der Shell-Historie.
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/password';

const email = z.email().safeParse(process.argv[2]);
if (!email.success) {
  console.error('Aufruf: bun --env-file=.env scripts/konto-anlegen.ts <e-mail>');
  process.exit(1);
}

const rl = createInterface({ input: stdin, output: stdout });
const passwort = await rl.question('Passwort (mindestens 12 Zeichen): ');
rl.close();

if (passwort.length < 12) {
  console.error('Zu kurz. Mindestens 12 Zeichen.');
  process.exit(1);
}

const adresse = email.data.toLowerCase();
const passwordHash = await hashPassword(passwort);

const [vorhanden] = await db.select().from(users).where(eq(users.email, adresse)).limit(1);

if (vorhanden) {
  await db.update(users).set({ passwordHash }).where(eq(users.id, vorhanden.id));
  console.log(`Passwort neu gesetzt für ${adresse}`);
} else {
  await db.insert(users).values({ email: adresse, passwordHash });
  console.log(`Konto angelegt: ${adresse}`);
}

process.exit(0);
