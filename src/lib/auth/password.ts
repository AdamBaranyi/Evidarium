import { hash, verify } from '@node-rs/argon2';

/*
 * Argon2id mit bewusst gesetzten Parametern statt Vorgabewerten — die
 * Vorgaben der Bibliothek können sich zwischen Fassungen ändern, und ein
 * still schwächer gewordener Hash fällt nirgends auf.
 *
 * Werte nach der OWASP-Empfehlung für Argon2id: 19 MiB Speicher, drei
 * Durchgänge, ein Nebenläufigkeitsgrad.
 */
const PARAMETER = { memoryCost: 19_456, timeCost: 3, parallelism: 1 } as const;

export function hashPassword(klartext: string): Promise<string> {
  return hash(klartext, PARAMETER);
}

/**
 * Prüft ein Passwort. Ein defekter oder fremder Hash gibt `false` zurück,
 * statt eine Ausnahme bis in die Antwort durchzureichen — sonst unterscheidet
 * ein Angreifer «Konto existiert nicht» von «Hash kaputt».
 */
export async function verifyPassword(hashWert: string, klartext: string): Promise<boolean> {
  try {
    return await verify(hashWert, klartext);
  } catch {
    return false;
  }
}
