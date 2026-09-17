-- Läuft einmal beim Anlegen des Datenverzeichnisses, gegen die Datenbank aus
-- POSTGRES_DB. Der Name steht darum nirgends fest: Entwicklungs- und
-- Testdatenbank heissen verschieden, dasselbe Skript bedient beide.
CREATE EXTENSION IF NOT EXISTS vector;

-- Zwei Rollen, weil Eigentümer und Superuser Row Level Security umgehen.
-- Der Eigentümer wandert durch die Migrationen, die Anwendung arbeitet mit
-- der eingeschränkten Rolle.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'evidarium_app') THEN
    CREATE ROLE evidarium_app LOGIN PASSWORD 'entwicklung-nur-lokal';
  END IF;

  EXECUTE format('GRANT CONNECT ON DATABASE %I TO evidarium_app', current_database());
END
$$;

GRANT USAGE ON SCHEMA public TO evidarium_app;

-- Gilt für Tabellen, die der Eigentümer künftig anlegt — also für alles, was
-- die Migrationen erzeugen.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO evidarium_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO evidarium_app;
