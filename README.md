# Evidarium

Wissensassistent für eigene Dokumente: hochladen, fragen, Antworten mit
anklickbaren Belegen erhalten.

**Antworten aus deinen Dokumenten – mit Quellen, die du nachlesen kannst.**

Das Produkt verspricht Nachprüfbarkeit, nicht Unfehlbarkeit. Jede Aussage
trägt eine Fundstelle, die sich im Originaldokument öffnen lässt; findet die
Suche keine Grundlage, sagt die Anwendung das, statt etwas zu erfinden.

## Start in unter zehn Minuten

```bash
cp .env.example .env
# SESSION_SECRET füllen:
openssl rand -base64 48

docker compose -f infra/docker-compose.yml up -d
bun install
bun run db:migrate
bun run dev
```

Die Anwendung läuft auf http://localhost:3100, die Datenbank auf Port 5450
(Testdatenbank 5451).

## Prüfen

```bash
bun run verify     # Format, Dateilänge, Schriftgrösse, Lint, Typen
bun run test       # Unit- und Integrationstests
bun run test:e2e   # Playwright bei 320, 768 und 1440 Pixeln
```

## Stack

Next.js mit App Router · TypeScript strict · Tailwind · PostgreSQL 18 mit
pgvector · Drizzle · Bun als Paketmanager, Node als Laufzeit für Next.

Embeddings laufen lokal auf dem eigenen Server; die Dokumente verlassen die
Maschine nicht. Nur die Antwortgenerierung nutzt eine Schnittstelle nach
aussen, mit hartem Monatsdeckel.

## Dokumentation

| Datei                      | Inhalt                                               |
| -------------------------- | ---------------------------------------------------- |
| `IMPLEMENTATION_STATUS.md` | Aktueller Stand, offene Punkte — zuerst lesen        |
| `docs/ARCHITEKTUR.md`      | Datenmodell und Ablauf vom Dokument bis zur Antwort  |
| `docs/CODE-QUALITY.md`     | 400-Zeilen-Regel, Schriftuntergrenze, wo was liegt   |
| `docs/SECURITY.md`         | Sicherheitsmassnahmen, bewertete Befunde, Ausnahmen  |
| `docs/BETRIEB.md`          | Migrationen, Sicherung, Wiederherstellung, Messwerte |
| `docs/ENTSCHEIDE.md`       | Nummerierte Entscheidungen mit Begründung            |
