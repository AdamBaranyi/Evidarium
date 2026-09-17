# Stand der Umsetzung

**Diese Datei zuerst lesen.** Sie sagt, was läuft, was in Arbeit ist und was
als Nächstes kommt. Am Ende jeder Arbeitseinheit fortschreiben.

Auftrag: `../Evidarium-Masterprompt-v1.md`

## Tag 1 — Fundament und Sicherheit · **fertig** (17.09.2026)

| Punkt                                                         | Stand     |
| ------------------------------------------------------------- | --------- |
| Repository, Git, Ausschluss von Werkzeugspuren                | fertig    |
| Next.js 16 mit App Router, TypeScript strict                  | fertig    |
| Tailwind mit Schriftuntergrenze 16 px                         | fertig    |
| Docker Compose: PostgreSQL 18 mit pgvector, Ports 5450/5451   | fertig    |
| Zwei Datenbankrollen (Eigentümer, Anwendung)                  | fertig    |
| Drizzle-Schema: `users`, `sessions`, `login_attempts`         | fertig    |
| Anmeldung: Argon2id, serverseitige Sitzung, Rate-Limit        | fertig    |
| Sicherheitsvorlage (täglicher Lauf, Dependabot, Erinnerungen) | fertig    |
| CI: Format, Dateilänge, Schrift, Lint, Typen, Tests, Build    | fertig    |
| **Installation, erste Migration, grüner Durchlauf**           | **offen** |

## Als Nächstes

Tag 2: Upload, Worker mit Jobqueue, Textextraktion mit Seitenzahlen,
Chunking, Dokumentbibliothek und Dokumentdetail.

**Vorgemerkt aus dem Sicherheits-Nachtrag vom 17.09.2026** (Masterprompt 9a):

- Tag 4: eigener API-Schlüssel nur serverseitig, Budget je Sitzung (10 Fragen),
  Tagesdeckel, Monatsdeckel, Ausgabenprotokoll in `usage_events`, freundliche
  Meldung statt Fehler beim Erreichen einer Grenze.
- Tag 5: öffentliche Demo mit vorbereitetem Korpus, **Upload nur für angemeldete
  Nutzer**; optional eigener Schlüssel je Sitzung.
- Abschnitt «Bewusst nicht gebaut» steht bereits im README.

## Aufgefallen

- Next 16 nennt die frühere `middleware.ts` jetzt `proxy.ts`.
- `agentRules: false` ist gesetzt, sonst schreibt `next dev` verwaltete Blöcke
  in `AGENTS.md` und `CLAUDE.md` des Projekts.
- Bun ist Paketmanager, nicht Laufzeit für Next: Die Bun-Runtime mit Turbopack
  löst mehrfache Fast-Refresh-Rebuilds aus.
- **PostgreSQL 18 erwartet den Mount auf `/var/lib/postgresql`**, nicht mehr auf
  dem Unterverzeichnis `data`. Mit dem alten Pfad startet der Container in einer
  Neustartschleife — der Fehlertext nennt das erst nach zwanzig Zeilen.
- **Den Schlüssel `eslint` gibt es in `next.config.ts` nicht mehr.** Next 16 ruft
  ESLint beim Build nicht mehr auf; der eigene Lint-Schritt in der CI ersetzt das.
- **Port 3100 statt 3000**, weil auf diesem Rechner ein anderes Projekt die 3000
  belegt. Datenbank auf 5450/5451, weil Tallyroom 5440/5441 hat.
- Das Init-Skript der Datenbank darf den Datenbanknamen nicht festschreiben —
  Entwicklungs- und Testdatenbank heissen verschieden.

## Blockiert

Nichts.
