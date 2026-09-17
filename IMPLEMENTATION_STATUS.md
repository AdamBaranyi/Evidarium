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

## Tag 2 — Dokumentpfad · **fertig** (17.09.2026)

| Punkt                                                                | Stand  |
| -------------------------------------------------------------------- | ------ |
| Upload als Route Handler, Typ am Inhalt geprüft                      | fertig |
| Grenzen serverseitig: 10 MiB, 100 Seiten, 300k Zeichen, 50 Dokumente | fertig |
| Dubletten je Nutzer über Inhaltshash                                 | fertig |
| Jobqueue in PostgreSQL (pg-boss 12.30.0)                             | fertig |
| Worker als eigener Prozess, geordnetes Herunterfahren                | fertig |
| PDF-Extraktion **mit Seitenzahlen**, Text mit Zeilenbereichen        | fertig |
| Zerlegung mit Überlappung, Dateiname im Abschnitt                    | fertig |
| Dokumentbibliothek und Dokumentdetail                                | fertig |
| Verständliche Fehler statt ewigem Ladezustand                        | fertig |

**Nachweis vom 17.09.2026, mit einem echten dreiseitigen PDF:**

- Upload antwortet mit 202, der Worker nimmt den Auftrag und meldet fertig
- 3 Seiten, 6857 Zeichen, 7 Abschnitte auf die Seiten 1, 2 und 3 verteilt
- Der versteckte Fakt «Mara Keller» liegt in Abschnitt 3 auf **Seite 2** —
  genau dort, wo er in der Quelle steht
- Ein PDF ohne Textschicht endet als `failed` mit `pdf_ohne_textschicht` und
  zeigt in der Oberfläche die vorgeschriebene Meldung
- Derselbe Job zweimal eingereiht: weiterhin 7 Abschnitte, **null Dubletten**

## Als Nächstes

Tag 3: lokale Embeddings über `transformers.js` im Worker, Vektorspalte und
pgvector-Index, deutsche und englische Volltextsuche, Hybrid mit Reciprocal
Rank Fusion, Messwerte in `docs/BETRIEB.md`.

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
- **pdf.js koppelt den übergebenen Puffer ab.** Nach dem ersten Aufruf ist
  `byteLength` null; ein zweiter Aufruf meldet «beschädigt» für eine
  einwandfreie Datei. Die Extraktion übergibt darum eine Kopie, mit
  Regressionstest.
- **Der Seitenvorschub (0x0C) gehört zu gültigem Text.** Die erste Fassung der
  Typerkennung warf ihn als Steuerzeichen raus und lehnte damit das eigene
  Testdokument ab.
- Ein alter Server aus einem Playwright-Lauf hält Port 3100 besetzt
  (`reuseExistingServer`). Vor dem Prüfen eines neuen Builds beenden.

## Blockiert

Nichts.
