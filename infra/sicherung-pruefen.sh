#!/usr/bin/env bash
# Probe des Zurückspielens: Die neueste nächtliche Sicherung wird in eine
# **eigene, vorübergehende** Datenbank geladen, gezählt und wieder entfernt.
# Die laufende Datenbank bleibt unberührt.
#
#   sudo /opt/evidarium/infra/sicherung-pruefen.sh
#
# Eine Sicherung, die nie zurückgespielt wurde, ist eine Vermutung. Einmal im
# Monat laufen lassen (docs/BETRIEB.md).
set -euo pipefail

unset DATABASE_URL DATABASE_URL_OWNER SESSION_SECRET APP_ORIGIN STORAGE_PATH
unset ANTHROPIC_API_KEY AI_MODE DEMO_AKTIV POSTGRES_PASSWORD APP_ROLE_PASSWORD

WURZEL="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UMGEBUNG="$WURZEL/infra/.env.production"
ZIEL="/var/backups/evidarium/nacht"
COMPOSE=(docker compose -f "$WURZEL/infra/compose.prod.yml" --env-file "$UMGEBUNG")
PROBE="evidarium_probe"

DB="$(ls -1t "$ZIEL"/db-*.dump 2>/dev/null | head -n 1 || true)"
DATEIEN="$(ls -1t "$ZIEL"/dateien-*.tar.gz 2>/dev/null | head -n 1 || true)"
if [ -z "$DB" ] || [ -z "$DATEIEN" ]; then
  echo "Keine nächtliche Sicherung in $ZIEL gefunden." >&2
  exit 1
fi
echo "Probe mit $DB und $DATEIEN"

psql_probe() { "${COMPOSE[@]}" exec -T db psql -U evidarium_owner -d "$PROBE" -tAc "$1"; }
# Ohne Hinweis «does not exist» beim ersten Aufräumen; echte Fehler bleiben sichtbar.
aufraeumen() {
  "${COMPOSE[@]}" exec -T -e PGOPTIONS='-c client_min_messages=warning' db \
    dropdb -U evidarium_owner --if-exists "$PROBE"
}
trap aufraeumen EXIT

aufraeumen
"${COMPOSE[@]}" exec -T db createdb -U evidarium_owner "$PROBE"
"${COMPOSE[@]}" exec -T db pg_restore -U evidarium_owner -d "$PROBE" --no-owner --exit-on-error < "$DB"

echo "Konten:     $(psql_probe 'select count(*) from users')"
echo "Dokumente:  $(psql_probe 'select count(*) from documents where deleted_at is null')"
echo "Abschnitte: $(psql_probe 'select count(*) from document_chunks')"
echo "Dateien im Archiv: $(tar -tzf "$DATEIEN" | grep -vc '/$')"
echo "Zurückspielen geprobt. Die Probedatenbank wird wieder entfernt."
