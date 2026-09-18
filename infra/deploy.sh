#!/usr/bin/env bash
# Deployment auf vps1. Läuft als root:
#
#   sudo /opt/evidarium/infra/deploy.sh [commit-oder-branch]
#
# Das Skript ist absichtlich langweilig und wiederholbar: holen, bauen,
# sichern, migrieren, neu starten. Es macht nichts, was sich nicht ein zweites
# Mal ausführen liesse.
set -euo pipefail

# Variablen aus der aufrufenden Shell entfernen.
#
# `docker compose --env-file` überschreibt **nichts**, was schon in der
# Umgebung steht — eine dort gesetzte DATABASE_URL gewänne still gegen die
# Datei, und der Container liefe gegen die falsche Datenbank. Genau das ist
# beim ersten Produktionstest passiert.
unset DATABASE_URL DATABASE_URL_OWNER SESSION_SECRET APP_ORIGIN STORAGE_PATH
unset ANTHROPIC_API_KEY AI_MODE DEMO_AKTIV POSTGRES_PASSWORD APP_ROLE_PASSWORD

WURZEL="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UMGEBUNG="$WURZEL/infra/.env.production"
SICHERUNG="/var/backups/evidarium"
COMPOSE=(docker compose -f "$WURZEL/infra/compose.prod.yml" --env-file "$UMGEBUNG")
ZIEL="${1:-main}"

melde() { printf '\n== %s\n' "$*"; }

# ---------------------------------------------------------------- Umgebung --
if [ ! -f "$UMGEBUNG" ]; then
  melde "Erster Lauf: $UMGEBUNG wird angelegt"

  # Passwörter und Geheimnisse werden **erzeugt**, nicht eingetippt. Sie
  # stehen nur in dieser Datei, nur für root lesbar.
  OWNER_PW="$(openssl rand -base64 32 | tr -d '/+=' | cut -c1-32)"
  APP_PW="$(openssl rand -base64 32 | tr -d '/+=' | cut -c1-32)"

  cat > "$UMGEBUNG" <<UMG
# Erzeugt von infra/deploy.sh. Nicht ins Repository, nicht kopieren.
POSTGRES_PASSWORD=$OWNER_PW
APP_ROLE_PASSWORD=$APP_PW
DATABASE_URL=postgres://evidarium_app:$APP_PW@db:5432/evidarium
DATABASE_URL_OWNER=postgres://evidarium_owner:$OWNER_PW@db:5432/evidarium
SESSION_SECRET=$(openssl rand -base64 48)

APP_ORIGIN=https://evidarium.adambaranyi.xyz

# Ohne Schlüssel bleibt der Demo-Modus aktiv: Die Anwendung läuft, ruft aber
# kein Modell auf. AI_MODE=live ohne Schlüssel bricht den Start ab.
AI_MODE=demo
ANTHROPIC_API_KEY=
AI_CHAT_MODEL=claude-haiku-4-5

BUDGET_MONAT_USD=10
BUDGET_TAG_USD=2
FRAGEN_JE_SITZUNG=10

# Öffentliche Demo. Erst einschalten, wenn der Korpus geladen ist:
#   docker compose ... exec worker bun scripts/demo-korpus-laden.ts
DEMO_AKTIV=false
DEMO_KONTO=demo@nordstern.test
DEMO_FRAGEN_JE_HERKUNFT_TAG=30
UMG

  chmod 600 "$UMGEBUNG"
  echo "Angelegt. Schlüssel und APP_ORIGIN prüfen, dann noch einmal starten."
  exit 0
fi

# ------------------------------------------------------------------ Stand ---
melde "Stand holen: $ZIEL"
git -C "$WURZEL" fetch --prune origin
git -C "$WURZEL" checkout --detach "origin/$ZIEL" 2>/dev/null || git -C "$WURZEL" checkout --detach "$ZIEL"
VERSION="$(git -C "$WURZEL" rev-parse --short HEAD)"
echo "HEAD steht auf $VERSION"

# ------------------------------------------------------------------- Bauen --
melde "Abbild bauen: evidarium:$VERSION"
docker build -f "$WURZEL/infra/Dockerfile" -t "evidarium:$VERSION" "$WURZEL"
export EVIDARIUM_VERSION="$VERSION"

# --------------------------------------------------------------- Sicherung --
# Vor jeder Migration, nicht danach. Eine Sicherung, die nach dem Schema-
# umbau entsteht, hilft beim Zurückrollen genau nicht.
melde "Datenbank sichern"
mkdir -p "$SICHERUNG"
if "${COMPOSE[@]}" ps --status running --services 2>/dev/null | grep -qx db; then
  DATEI="$SICHERUNG/evidarium-$(date +%Y%m%d-%H%M%S)-vor-$VERSION.sql.gz"
  "${COMPOSE[@]}" exec -T db pg_dump -U evidarium_owner evidarium | gzip > "$DATEI"
  echo "Gesichert nach $DATEI"
  # Ältere Sicherungen bleiben liegen; aufgeräumt wird bewusst von Hand.
else
  echo "Datenbank läuft noch nicht — erste Einrichtung, nichts zu sichern."
fi

# ------------------------------------------------------------------ Start ---
melde "Datenbank starten"
"${COMPOSE[@]}" up -d db

melde "Migrationen einspielen"
# Die Eigentümer-URL steht in der Umgebungsdatei; `run -e NAME` reicht sie
# an den Container weiter. Ohne sie liefe die Migration als Anwendungsrolle
# und dürfte keine Tabellen anlegen.
"${COMPOSE[@]}" run --rm --no-deps -e DATABASE_URL_OWNER web bun scripts/migrieren.ts

melde "Anwendung starten"
"${COMPOSE[@]}" up -d --remove-orphans

melde "Stand"
"${COMPOSE[@]}" ps
echo
echo "Fertig: $VERSION"
echo "Erstes Konto:  ${COMPOSE[*]} exec web bun scripts/konto-anlegen.ts <e-mail>"
echo "Demo-Korpus:   ${COMPOSE[*]} exec worker bun scripts/demo-korpus-laden.ts"
