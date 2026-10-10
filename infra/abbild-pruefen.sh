#!/usr/bin/env bash
# Startet das fertige Produktionsabbild und prüft, ob es antwortet wie in
# next.config.ts eingestellt. Aufruf: bash infra/abbild-pruefen.sh <abbild>
#
# `next start` liest Laufzeit-Optionen (Bildoptimierung, X-Powered-By) beim
# Start aus next.config.ts, nicht aus dem Build. Fehlt die Datei im Abbild,
# gelten still die Vorgaben von Next. So am 10.10.2026 live gefunden, während
# alle Tests gegen den Checkout grün waren, in dem die Datei liegt.
set -euo pipefail
abbild="${1:?Aufruf: bash infra/abbild-pruefen.sh <abbild>}"
name="abbild-pruefen-$$"
port="${PRUEF_PORT:-3400}"

docker run -d --name "$name" -p "127.0.0.1:$port:3100" \
  -e DATABASE_URL=postgres://pruefung:pruefung@127.0.0.1:5432/pruefung \
  -e SESSION_SECRET="$(openssl rand -base64 36)" \
  -e APP_ORIGIN="http://localhost:$port" \
  -e STORAGE_PATH=/app/storage \
  "$abbild" > /dev/null
trap 'docker rm -f "$name" > /dev/null' EXIT

bild="http://localhost:$port/_next/image?url=%2Fopengraph-image.png&w=64&q=75"
code=000
for _ in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "$bild" || true)
  [ "$code" != 000 ] && break
  sleep 1
done

fehler=0
if [ "$code" = 404 ]; then
  echo "Bildoptimierung aus: /_next/image antwortet 404"
else
  echo "FEHLER: /_next/image antwortet $code statt 404" >&2
  fehler=1
fi
if curl -s -D - -o /dev/null --max-time 10 "http://localhost:$port/" | grep -qi '^x-powered-by'; then
  echo "FEHLER: Die Startseite sendet X-Powered-By" >&2
  fehler=1
else
  echo "Kein X-Powered-By"
fi
if [ "$fehler" != 0 ]; then
  docker logs "$name" 2>&1 | tail -20 >&2
fi
exit "$fehler"
