'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { passwortPruefenGleichlang } from '@/lib/auth/password';
import { createSession, hashOrigin, SESSION_COOKIE } from '@/lib/auth/session';
import { fehlversucheLoeschen, fehlversuchNotieren, loginErlaubt } from '@/lib/auth/rate-limit';
import { clientHerkunft, herkunftStimmt } from '@/lib/auth/request';

const Eingabe = z.object({
  email: z.email().max(320),
  password: z.string().min(1).max(512),
});

export type LoginErgebnis = { fehler: string } | undefined;

export async function login(_: LoginErgebnis, formData: FormData): Promise<LoginErgebnis> {
  if (!(await herkunftStimmt())) return { fehler: 'Anfrage abgelehnt.' };

  const eingabe = Eingabe.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!eingabe.success) return { fehler: 'E-Mail oder Passwort stimmt nicht.' };

  const originHash = hashOrigin(await clientHerkunft());
  if (!(await loginErlaubt(originHash))) {
    return { fehler: 'Zu viele Versuche. Bitte in 15 Minuten erneut probieren.' };
  }

  const [konto] = await db
    .select()
    .from(users)
    .where(eq(users.email, eingabe.data.email.toLowerCase()))
    .limit(1);

  // Dieselbe Meldung für «kein Konto», «falsches Passwort» und «deaktiviert» —
  // sonst lässt sich über die Anmeldemaske herausfinden, welche Adressen
  // registriert sind.
  // Immer eine volle Argon2-Prüfung, auch ohne Konto — sonst verriete die
  // Laufzeit, welche Adressen registriert sind.
  const passwortPasst = await passwortPruefenGleichlang(
    konto?.passwordHash ?? null,
    eingabe.data.password,
  );
  const stimmt = konto !== undefined && konto.status === 'active' && passwortPasst;

  if (!stimmt || konto === undefined) {
    await fehlversuchNotieren(originHash);
    return { fehler: 'E-Mail oder Passwort stimmt nicht.' };
  }

  await fehlversucheLoeschen(originHash);
  const sitzung = await createSession(konto.id);

  (await cookies()).set(SESSION_COOKIE, sitzung.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: sitzung.expiresAt,
  });

  redirect('/app');
}
