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

/*
 * Ein Schein-Hash mit denselben Parametern, einmal je Prozess erzeugt — nicht
 * fest im Code, damit er garantiert zu den aktuellen Parametern passt.
 */
const scheinHash = hash(crypto.randomUUID(), PARAMETER);

/**
 * Prüft ein Passwort **immer gleich lang**, ob es das Konto gibt oder nicht.
 *
 * Ohne diese Funktion lief bei einer unbekannten Adresse gar kein Argon2:
 * Die Antwort kam messbar schneller, und über die Laufzeit liess sich
 * herausfinden, welche Adressen ein Konto haben — die gleichlautende
 * Fehlermeldung half dann nichts. Befund S5 im Prüfbericht.
 *
 * Dasselbe gilt für Konten ohne gültigen Hash, etwa das Demo-Konto: Auch dort
 * wird gegen den Schein-Hash gerechnet, statt sofort abzubrechen.
 */
export async function passwortPruefenGleichlang(
  hashWert: string | null,
  klartext: string,
): Promise<boolean> {
  const echt = hashWert !== null && hashWert.startsWith('$argon2');
  const passt = await verifyPassword(echt ? hashWert : await scheinHash, klartext);
  return echt && passt;
}
