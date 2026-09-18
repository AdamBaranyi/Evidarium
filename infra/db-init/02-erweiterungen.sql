-- Läuft einmal beim Anlegen des Datenverzeichnisses, gegen die Datenbank aus
-- POSTGRES_DB. Der Name steht darum nirgends fest: Entwicklungs- und
-- Testdatenbank heissen verschieden, dasselbe Skript bedient beide.
CREATE EXTENSION IF NOT EXISTS vector;

-- Die Rolle `evidarium_app` legt 01-anwendungsrolle.sh an; ihr Passwort kommt
-- aus der Umgebung. Zwei Rollen, weil Eigentümer und Superuser Row Level
-- Security umgehen: Der Eigentümer wandert durch die Migrationen, die
-- Anwendung arbeitet mit der eingeschränkten Rolle.

GRANT USAGE ON SCHEMA public TO evidarium_app;

-- Gilt für Tabellen, die der Eigentümer künftig anlegt — also für alles, was
-- die Migrationen erzeugen.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO evidarium_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO evidarium_app;
