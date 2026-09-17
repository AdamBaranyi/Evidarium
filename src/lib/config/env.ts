import { z } from 'zod';

/*
 * Konfiguration wird beim Start geprüft, nicht beim ersten Zugriff.
 *
 * Kein Vorgabewert für Zugangsdaten: Ein Default macht aus einem
 * Konfigurationsfehler eine stille Verbindung mit einem im Repository
 * stehenden Passwort. Fehlt ein Wert, bricht die Anwendung ab.
 */
const Schema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  DATABASE_URL_OWNER: z.url({ protocol: /^postgres(ql)?$/ }).optional(),
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET braucht mindestens 32 Zeichen. Erzeugen: openssl rand -base64 48'),
  APP_ORIGIN: z.url({ protocol: /^https?$/ }),
  TRUST_PROXY: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export type Env = z.infer<typeof Schema>;

function lesen(): Env {
  const ergebnis = Schema.safeParse(process.env);
  if (!ergebnis.success) {
    const zeilen = ergebnis.error.issues.map(
      (issue) => `  ${issue.path.join('.') || '(Wurzel)'}: ${issue.message}`,
    );
    throw new Error(
      `Konfiguration unvollständig oder widersprüchlich:\n${zeilen.join('\n')}\n` +
        'Vorlage: .env.example',
    );
  }
  return ergebnis.data;
}

export const env = lesen();
