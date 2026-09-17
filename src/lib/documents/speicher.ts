import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { env } from '@/lib/config/env';

/*
 * Dateien liegen auf einem lokalen Volume, nicht in einem Objektspeicher.
 * Das ist eine bewusste Vereinfachung für den ersten Release (siehe
 * docs/ENTSCHEIDE.md): Der Pfad steckt hinter dieser Datei, ein Umzug
 * betrifft darum nur sie.
 *
 * Der Pfad wird **serverseitig** aus Nutzer- und Dokument-ID gebildet, nie
 * aus dem Dateinamen. Ein Dateiname aus dem Browser darf nirgends in einen
 * Pfad geraten — sonst genügt `../../etc/passwd`, um daneben zu schreiben.
 */
function pfadFuer(userId: string, documentId: string): string {
  const wurzel = resolve(env.STORAGE_PATH);
  const ziel = resolve(join(wurzel, userId, documentId));

  // Gürtel und Hosenträger: Selbst wenn eine ID je manipuliert würde, bleibt
  // alles unterhalb der Wurzel.
  if (!ziel.startsWith(`${wurzel}/`)) {
    throw new Error('Pfad liegt ausserhalb des Speicherverzeichnisses');
  }
  return ziel;
}

export async function ablegen(
  userId: string,
  documentId: string,
  bytes: Uint8Array,
): Promise<string> {
  const ziel = pfadFuer(userId, documentId);
  await mkdir(dirname(ziel), { recursive: true });
  await writeFile(ziel, bytes);
  return ziel;
}

export async function lesen(storagePath: string): Promise<Uint8Array> {
  return new Uint8Array(await readFile(storagePath));
}

/** Fehlt die Datei schon, ist das kein Fehler — das Ziel ist erreicht. */
export async function entfernen(storagePath: string): Promise<void> {
  await rm(storagePath, { force: true });
}
