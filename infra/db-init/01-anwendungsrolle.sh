#!/bin/bash
# Legt die Anwendungsrolle an. Läuft einmal, beim Anlegen des
# Datenverzeichnisses.
#
# Als Shell-Skript und nicht als SQL, weil das Passwort aus der Umgebung
# kommen muss. In der ersten Fassung stand es in der SQL-Datei — lokal
# harmlos, in Produktion ein Passwort im öffentlichen Repository.
#
# Ohne APP_ROLE_PASSWORD bricht der Start ab. Ein Vorgabewert wäre genau der
# Fehler, den diese Änderung behebt.
set -euo pipefail

if [ -z "${APP_ROLE_PASSWORD:-}" ]; then
  echo "APP_ROLE_PASSWORD fehlt. Die Anwendungsrolle bekommt kein Vorgabepasswort." >&2
  exit 1
fi

# `\gexec` statt eines DO-Blocks: **psql ersetzt seine Variablen nicht
# innerhalb von $$-Blöcken.** Die erste Fassung lief darum auf
# «syntax error at or near ":"», das Init brach ab, und die Erweiterung
# `vector` aus der nächsten Datei wurde nie angelegt — der Fehler zeigte sich
# erst drei Schritte später beim Migrieren.
#
# `format(... %L ...)` maskiert das Passwort als Literal; zusammengesetzt wird
# in der Datenbank, nicht in der Shell.
psql -v ON_ERROR_STOP=1 \
     --username "$POSTGRES_USER" \
     --dbname "$POSTGRES_DB" \
     --set=passwort="$APP_ROLE_PASSWORD" <<'SQL'
SELECT format('CREATE ROLE evidarium_app LOGIN PASSWORD %L', :'passwort')
 WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'evidarium_app')
\gexec

SELECT format('GRANT CONNECT ON DATABASE %I TO evidarium_app', current_database())
\gexec
SQL
