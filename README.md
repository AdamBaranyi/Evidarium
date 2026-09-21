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

**Was den Server verlässt, und was nicht.** Dateien werden auf dem eigenen
Server eingelesen, zerlegt und eingebettet; die Suche läuft dort. Ganze
Dateien verlassen ihn nie. Für eine Antwort gehen die gefundenen Abschnitte —
höchstens acht je Frage — zusammen mit der Frage an die Schnittstelle von
Anthropic, mit hartem Monatsdeckel. Im Demo-Modus geht gar nichts hinaus.

## Bewusst nicht gebaut

Jede Auslassung hier ist eine Entscheidung, keine Lücke — mit dem, was
stattdessen getan wurde.

**Kein Zwei-Faktor.** Der Demo-Zugang ist öffentlich dokumentiert; ein zweiter
Faktor davor schützt nichts. Das echte Risiko ist der API-Schlüssel, und der
liegt ausschliesslich auf dem Server, mit Budgetgrenzen je Sitzung, je Tag und
je Monat. Zwei-Faktor sitzt dort, wo es zählt: auf den Konten des Betreibers.

**Kein Passwort-Reset per Mail.** Dafür bräuchte es einen Mailversand, eine
Warteschlange für Zustellfehler und Schutz vor Konten-Aufzählung — Aufwand für
eine Handvoll Konten, die über einen lokalen Befehl entstehen. Passwörter setzt
`bun run konto:anlegen` neu, auf der Maschine, auf der die Anwendung läuft.

**Keine Kontolöschung in der Oberfläche.** Dieselbe Begründung. Was es
stattdessen gibt, ist die vollständige Löschkaskade für **Dokumente** — die ist
gebaut und getestet, weil sie zur Kernfunktion gehört: Ein gelöschtes Dokument
verschwindet aus Suche, Auswahl und aus allen Antworten, die es als Grundlage
hatten.

**Kein zentraler Identitätsdienst.** Für eine Demo wäre er Betriebsaufwand und
ein zusätzlicher Ausfallpunkt: Steht er still, kommt niemand mehr hinein. Er
kommt, sobald es echte Nutzer gibt — dann als zweiter Anmeldeweg neben der
lokalen Anmeldung, damit der Rundgang unabhängig bleibt.

## Dokumentation

| Datei                      | Inhalt                                                |
| -------------------------- | ----------------------------------------------------- |
| `IMPLEMENTATION_STATUS.md` | Aktueller Stand, offene Punkte — zuerst lesen         |
| `docs/ARCHITEKTUR.md`      | Datenmodell und Ablauf vom Dokument bis zur Antwort   |
| `docs/CODE-QUALITY.md`     | 400-Zeilen-Regel, Schriftuntergrenze, wo was liegt    |
| `docs/SECURITY.md`         | Sicherheitsmassnahmen, bewertete Befunde, Ausnahmen   |
| `docs/BETRIEB.md`          | Migrationen, Sicherung, Wiederherstellung, Messwerte  |
| `docs/ENTSCHEIDE.md`       | Nummerierte Entscheidungen mit Begründung             |
| `docs/EVALUATION.md`       | Ergebnis des letzten Prüflaufs, Antworten im Wortlaut |
| `docs/FALLSTUDIE.md`       | Die Fallstudie für die Portfolio-Seite                |
