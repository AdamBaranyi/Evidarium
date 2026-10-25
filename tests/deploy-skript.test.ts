import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  attrappenOrdner,
  aufrufe,
  ordnerEntfernen,
  skriptAusfuehren,
  unbekannteAufrufe,
} from './attrappen';

/*
 * infra/deploy.sh im Ablauf, mit Attrappen für docker und git. Das Skript
 * läuft aus einer Kopie in einem leeren Ordner, damit es dort seine
 * Umgebungsdatei findet und nichts im Repository berührt.
 *
 * Die Abbilder: Ein Tag wie pgvector/pgvector:0.8.7-pg18 baut der Hersteller
 * unter derselben Nummer neu, wenn darunter eine Lücke geschlossen wird.
 * Compose zieht ein vorhandenes Abbild nie von selbst neu, und `docker build`
 * ohne `--pull` darf die Basis-Abbilder von der Platte nehmen. Beides holt
 * das Skript darum bei jedem Lauf frisch; die Datenbank wird aber erst nach
 * der Sicherung getauscht.
 */
const DOCKER = `#!/usr/bin/env bash
d="$ATTRAPPE_DIR"
printf 'docker %s\\n' "$*" >> "$d/aufrufe"
case " $* " in
  " build "*) ;;
  " compose "*" pull db ") ;;
  " compose "*" ps --status running --services ") echo db ;;
  " compose "*" exec -T db pg_dump "*) echo '-- Sicherung' ;;
  " compose "*" ps -q "*) echo c0ffee ;;
  " compose "*" up "*|" compose "*" run "*|" compose "*" ps ") ;;
  " inspect "*) echo healthy ;;
  *) printf '%s\\n' "$*" >> "$d/unbekannt"; exit 1 ;;
esac
`;

const GIT = `#!/usr/bin/env bash
printf 'git %s\\n' "$*" >> "$ATTRAPPE_DIR/aufrufe"
case " $* " in
  *" rev-parse --short HEAD ") echo abc1234 ;;
esac
`;

let ordner = '';
let wurzel = '';
afterEach(() => {
  expect(unbekannteAufrufe(ordner)).toEqual([]);
  ordnerEntfernen(ordner);
  rmSync(wurzel, { recursive: true, force: true });
});

function ausrollen(): { code: number | null; ausgabe: string; liste: string[] } {
  ordner = attrappenOrdner({ docker: DOCKER, git: GIT });
  wurzel = mkdtempSync(join(tmpdir(), 'evidarium-deploy-'));
  mkdirSync(join(wurzel, 'infra'));
  copyFileSync('infra/deploy.sh', join(wurzel, 'infra', 'deploy.sh'));
  writeFileSync(
    join(wurzel, 'infra', '.env.production'),
    'BETREIBER_NAME="Test Betrieb"\nBETREIBER_ADRESSE="Teststrasse 1"\nBETREIBER_EMAIL=test@example.org\n',
  );
  // Mit der umask eines gewöhnlichen root-Aufrufs (022), unabhängig davon,
  // wie die Umgebung des Tests eingestellt ist.
  const lauf = skriptAusfuehren(
    '-c',
    ['umask 022 && exec bash "$0"', join(wurzel, 'infra', 'deploy.sh')],
    ordner,
    { EVIDARIUM_SICHERUNG: join(wurzel, 'sicherung') },
  );
  return { ...lauf, liste: aufrufe(ordner) };
}

function stelle(liste: string[], muster: RegExp): number {
  const index = liste.findIndex((zeile) => muster.test(zeile));
  expect(index, `kein Aufruf passt zu ${muster}:\n${liste.join('\n')}`).toBeGreaterThanOrEqual(0);
  return index;
}

const DB_TAUSCH = /^docker compose .* up -d --wait --wait-timeout 180 db$/;

describe('infra/deploy.sh', () => {
  it('baut das Abbild mit frisch gezogenen Basis-Abbildern', () => {
    const { code, ausgabe, liste } = ausrollen();

    expect(code, ausgabe).toBe(0);
    expect(liste.filter((zeile) => zeile.startsWith('docker build'))).toEqual([
      `docker build --pull -f ${wurzel}/infra/Dockerfile -t evidarium:abc1234 ${wurzel}`,
    ]);
  });

  it('zieht das Datenbank-Abbild neu, bevor die Datenbank startet', () => {
    const { code, ausgabe, liste } = ausrollen();

    expect(code, ausgabe).toBe(0);
    expect(stelle(liste, /^docker compose .* pull db$/)).toBeLessThan(stelle(liste, DB_TAUSCH));
  });

  /*
   * Die Sicherung enthält Konten und den Text aller Dokumente. Mit der
   * gewöhnlichen umask entstünde sie lesbar für jedes Konto auf dem Server
   * (Datei 644 im Ordner 755); die nächtliche Sicherung in infra/sichern.sh
   * setzt 700 und 600 schon.
   */
  it('die Sicherung vor dem Ausrollen kann nur root lesen', () => {
    const { code, ausgabe } = ausrollen();

    expect(code, ausgabe).toBe(0);
    const ablage = join(wurzel, 'sicherung');
    const dateien = readdirSync(ablage);
    expect(dateien).toHaveLength(1);
    expect((statSync(ablage).mode & 0o777).toString(8)).toBe('700');
    expect((statSync(join(ablage, dateien[0] ?? '')).mode & 0o777).toString(8)).toBe('600');
  });

  it('tauscht die Datenbank erst nach der Sicherung', () => {
    const { code, ausgabe, liste } = ausrollen();

    expect(code, ausgabe).toBe(0);
    expect(stelle(liste, /^docker compose .* exec -T db pg_dump /)).toBeLessThan(
      stelle(liste, DB_TAUSCH),
    );
  });
});
