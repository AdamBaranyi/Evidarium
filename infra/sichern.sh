#!/usr/bin/env bash
# Nächtliche Sicherung auf vps1: Datenbank und Dateien, zusammen. Läuft als
# root, jede Nacht über infra/systemd/evidarium-sicherung.timer, oder von Hand:
#
#   sudo /opt/evidarium/infra/sichern.sh
#
# Datenbank und Dateien gehören zusammen: Eine Datenbank ohne ihre Dateien
# hinterlässt Dokumente ohne Inhalt, Dateien ohne Datenbank verwaiste Bytes.
# Beides entsteht darum im selben Lauf, mit demselben Zeitstempel.
set -euo pipefail

# Wie in deploy.sh: Nichts aus der aufrufenden Shell darf gegen die
# Umgebungsdatei gewinnen.
unset DATABASE_URL DATABASE_URL_OWNER SESSION_SECRET APP_ORIGIN STORAGE_PATH
unset ANTHROPIC_API_KEY AI_MODE DEMO_AKTIV POSTGRES_PASSWORD APP_ROLE_PASSWORD

WURZEL="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UMGEBUNG="$WURZEL/infra/.env.production"
ZIEL="/var/backups/evidarium/nacht"
TAGE=14
COMPOSE=(docker compose -f "$WURZEL/infra/compose.prod.yml" --env-file "$UMGEBUNG")
STEMPEL="$(date +%Y%m%d-%H%M%S)"
DB="$ZIEL/db-$STEMPEL.dump"
DATEIEN="$ZIEL/dateien-$STEMPEL.tar.gz"

mkdir -p "$ZIEL"
chmod 700 "$ZIEL"

# Eigenes Format von pg_dump: Es lässt sich mit pg_restore prüfen und auch
# tabellenweise zurückholen. Eine halb geschriebene Datei wird entfernt,
# damit sie nie als letzte gute Sicherung dasteht.
if ! "${COMPOSE[@]}" exec -T db pg_dump -U evidarium_owner -Fc evidarium > "$DB"; then
  rm -f "$DB"
  echo "Abbruch: pg_dump ist gescheitert." >&2
  exit 1
fi
"${COMPOSE[@]}" exec -T db pg_restore --list < "$DB" > /dev/null

# Die Dateien aus dem Web-Container, nur lesend; tar und gzip sind im Abbild.
if ! "${COMPOSE[@]}" exec -T web tar -czf - -C /app/storage . > "$DATEIEN"; then
  rm -f "$DATEIEN"
  echo "Abbruch: Die Dateien liessen sich nicht sichern." >&2
  exit 1
fi
tar -tzf "$DATEIEN" > /dev/null
chmod 600 "$DB" "$DATEIEN"

# Aufgeräumt werden nur die nächtlichen Sicherungen, und nur ältere als
# $TAGE Tage. Die Sicherungen vor einer Migration (deploy.sh) liegen eine
# Ebene höher und bleiben unberührt.
find "$ZIEL" -maxdepth 1 -type f \( -name 'db-*.dump' -o -name 'dateien-*.tar.gz' \) \
  -mtime +"$TAGE" -delete

echo "Gesichert: $DB ($(du -h "$DB" | cut -f1)), $DATEIEN ($(du -h "$DATEIEN" | cut -f1))"
