# Codequalität

## Höchstens 400 Zeilen je Datei

Feste Projektregel, ab dem ersten Commit. Gezählt werden physische Zeilen
einschliesslich Leerzeilen und Kommentaren, nach der Formatierung.

Durchgesetzt an zwei Stellen:

- ESLint-Regel `max-lines` für JavaScript und TypeScript
- `bun run check:file-length` zusätzlich für CSS, SQL, YAML und Dockerfiles,
  die ESLint nicht sieht

400 ist eine Obergrenze, kein Zielwert. Sehr kurze Dateien sind erwünscht.

**Ausgenommen:** von Drizzle erzeugte Migrationen (`src/lib/db/migrations/`)
und reine Daten-Fixtures (`tests/fixtures/`). Die Ausnahme erlaubt nicht, eigene
Logik dorthin zu verschieben.

## Keine Schrift unter 16 Pixeln

Auf keiner Breite, in keinem Element — auch nicht in Fusszeilen, Labels,
Badges oder Diagrammachsen. Hierarchie entsteht über Schnitt, Versalien,
Gewicht und Farbe, nicht über kleinere Grössen.

Durchgesetzt an drei Stellen:

- Tailwinds `text-xs` und `text-sm` stehen im Theme auf `initial`, die Klassen
  entstehen gar nicht erst
- `bun run check:font-floor` liest den Quelltext
- `e2e/font-size.spec.ts` misst, was der Browser rechnet, bei 320, 768 und 1440

## Wo was liegt

| Pfad              | Inhalt                                             |
| ----------------- | -------------------------------------------------- |
| `src/app/`        | Seiten und Server Actions                          |
| `src/lib/config/` | Geprüfte Konfiguration, bricht beim Start ab       |
| `src/lib/db/`     | Schema, Verbindung, Migrationen                    |
| `src/lib/auth/`   | Passwörter, Sitzungen, Rate-Limit, Anfrageherkunft |
| `src/styles/`     | Grundwerte für Farbe, Schrift, Abstände            |
| `scripts/`        | Prüfskripte                                        |
| `infra/`          | Docker Compose, Datenbankvorbereitung              |
| `e2e/`            | Playwright                                         |

Geschäftslogik liegt nicht in Komponenten. Komponenten greifen nie direkt auf
Datenbank oder Anbieter zu.

## TypeScript

`strict` bleibt an, dazu `noUncheckedIndexedAccess` und
`exactOptionalPropertyTypes`. Kein pauschales `any`, kein `@ts-ignore` zum
Wegdrücken von Fehlern. Fremde Daten kommen als `unknown` herein und werden
mit Zod validiert.
