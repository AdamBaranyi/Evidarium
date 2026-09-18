import { z } from 'zod';

/*
 * Konfiguration wird beim Start geprüft, nicht beim ersten Zugriff.
 *
 * Kein Vorgabewert für Zugangsdaten: Ein Default macht aus einem
 * Konfigurationsfehler eine stille Verbindung mit einem im Repository
 * stehenden Passwort. Fehlt ein Wert, bricht die Anwendung ab.
 */
/**
 * Eine **leere** Umgebungsvariable heisst «nicht gesetzt», nicht «leerer Wert».
 *
 * `docker compose` setzt `ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-}` auch dann,
 * wenn nichts hinterlegt ist — als leere Zeichenkette. Ohne diese Umwandlung
 * scheitert `min(1)`, und die Anwendung startet im Demo-Modus gar nicht erst.
 * Gefunden am 18.09.2026 im ersten Produktionslauf; lokal fiel es nie auf,
 * weil dort ein Schlüssel gesetzt ist.
 */
function leerIstFehlend<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((wert) => (wert === '' ? undefined : wert), schema);
}

const Schema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  DATABASE_URL_OWNER: leerIstFehlend(z.url({ protocol: /^postgres(ql)?$/ }).optional()),
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET braucht mindestens 32 Zeichen. Erzeugen: openssl rand -base64 48'),
  APP_ORIGIN: z.url({ protocol: /^https?$/ }),
  STORAGE_PATH: z.string().min(1, 'STORAGE_PATH fehlt. Beispiel: ./storage'),
  // Interner Endpunkt des Workers. Nur 127.0.0.1 — der Endpunkt hat keine
  // Anmeldung und darf das Gerät nie verlassen.
  WORKER_INTERN_URL: z.url({ protocol: /^http$/ }).default('http://127.0.0.1:3101'),
  WORKER_INTERN_PORT: z.coerce.number().int().min(1).max(65535).default(3101),
  /*
   * Adresse, auf der der Worker seinen internen Endpunkt anbietet.
   *
   * Vorgabe `127.0.0.1`: auf einem Einzelrechner richtig und die sichere
   * Voreinstellung. Im Containerbetrieb laufen Web und Worker in **getrennten**
   * Netz-Namensräumen — dort erreicht `127.0.0.1` nur den Worker selbst, und
   * die Weboberfläche bekommt ECONNREFUSED. Dann `0.0.0.0`, zusammen mit einem
   * eigenen Compose-Netz und **ohne** veröffentlichten Port: Der Endpunkt ist
   * nur aus den Containern desselben Netzes erreichbar.
   */
  WORKER_INTERN_HOST: z.string().min(1).default('127.0.0.1'),

  /*
   * `demo` ruft kein Modell auf und kostet nichts. `live` braucht einen
   * Schlüssel und ein Budget.
   *
   * Die Prüfung unten erzwingt, dass `live` ohne Schlüssel gar nicht erst
   * startet — sonst liefe die Anwendung an und fiele erst bei der ersten
   * Frage um, mit einer Meldung, die nach einem Produktfehler aussieht.
   */
  AI_MODE: z.enum(['demo', 'live']).default('demo'),
  ANTHROPIC_API_KEY: leerIstFehlend(z.string().min(1).optional()),
  AI_CHAT_MODEL: z.string().min(1).default('claude-haiku-4-5'),

  /* Harte Deckel. Siehe Masterprompt 9a und docs/SECURITY.md. */
  BUDGET_MONAT_USD: z.coerce.number().positive().default(10),
  BUDGET_TAG_USD: z.coerce.number().positive().default(2),
  FRAGEN_JE_SITZUNG: z.coerce.number().int().positive().default(10),
  /*
   * Die öffentliche Demo. Standardmässig **aus**: Eine Installation, die
   * jemand nachbaut, soll nicht versehentlich einen fremden Schlüssel an
   * einer offenen Seite hängen haben.
   */
  DEMO_AKTIV: z
    .enum(['true', 'false'])
    .default('false')
    .transform((wert) => wert === 'true'),
  DEMO_KONTO: z.email().default('demo@nordstern.test'),
  /*
   * Fragen je Herkunft und Tag. Die eigentliche Schranke bleibt der
   * Tagesdeckel in Dollar — diese Zahl verhindert nur, dass eine einzelne
   * Quelle ihn allein aufbraucht.
   */
  DEMO_FRAGEN_JE_HERKUNFT_TAG: z.coerce.number().int().positive().default(30),
  TRUST_PROXY: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

const Geprueft = Schema.refine(
  (werte) => werte.AI_MODE === 'demo' || (werte.ANTHROPIC_API_KEY ?? '') !== '',
  {
    path: ['ANTHROPIC_API_KEY'],
    error: 'AI_MODE=live braucht ANTHROPIC_API_KEY. Ohne Schlüssel bleibt AI_MODE=demo.',
  },
)
  .refine((werte) => werte.BUDGET_TAG_USD <= werte.BUDGET_MONAT_USD, {
    path: ['BUDGET_TAG_USD'],
    error: 'Der Tagesdeckel darf nicht über dem Monatsdeckel liegen.',
  })
  /*
   * Eine offene Demo ohne Herkunftserkennung hinter einem Reverse Proxy
   * hätte für alle Besucher denselben Zähler: Das Limit je Herkunft griffe
   * nie, und ein einzelner Besucher könnte den Tagesdeckel allein leeren.
   */
  .refine(
    (werte) => !werte.DEMO_AKTIV || werte.TRUST_PROXY || process.env.NODE_ENV !== 'production',
    {
      path: ['DEMO_AKTIV'],
      error:
        'DEMO_AKTIV=true braucht in Produktion TRUST_PROXY=true — sonst zählt das Limit je Herkunft alle Besucher als einen.',
    },
  );

export type Env = z.infer<typeof Schema>;

function lesen(): Env {
  const ergebnis = Geprueft.safeParse(process.env);
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
