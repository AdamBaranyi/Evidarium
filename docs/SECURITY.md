# Sicherheit

Ab dem ersten Commit, nicht nachträglich.

## Automatische Prüfungen

| Wann                | Was                                                                           | Datei                                           |
| ------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------- |
| Täglich 06:17 UTC   | gitleaks über die ganze Historie, `bun audit` ab «moderat»                    | `.github/workflows/sicherheit-taeglich.yml`     |
| Jeder Push und PR   | Format, Dateilänge, Schrift, Lint, Typen, Tests, Build, `bun audit` ab «hoch» | `.github/workflows/ci.yml`                      |
| Wöchentlich montags | Dependabot, Minor und Patch als Sammel-PR, sieben Tage Wartezeit              | `.github/dependabot.yml`                        |
| Wöchentlich montags | Erinnerung, **nur** wenn Update-PRs offen sind                                | `.github/workflows/erinnerung-woechentlich.yml` |
| Monatlich am Ersten | Wartungscheckliste für das, was am Server passiert                            | `.github/workflows/erinnerung-monatlich.yml`    |

Die Meldung geht an Adam, nicht an ein Werkzeug: `assignees` in Dependabot,
`--assignee` bei den Erinnerungs-Issues, GitHub-Benachrichtigung für
fehlgeschlagene geplante Läufe.

## Bewertete Befunde und Ausnahmen

Ausnahmen werden **namentlich** als GHSA-Nummer eingetragen, nie als ganze
Schweregrad-Stufe. Ein täglich roter Lauf verdeckt sonst die echte Meldung.
Fällt ein Befund weg, fällt seine Ausnahme weg.

### GHSA-67mh-4wv8-2f99 — esbuild ≤ 0.24.2

_Bewertet 17.09.2026. Schweregrad moderat. Kein Update verfügbar._

**Woher:** `drizzle-kit → esbuild` und `vitest → @vitest/mocker → vite → tsx → esbuild`.
Beide sind Entwicklungswerkzeuge, keine Laufzeitabhängigkeiten.

**Was der Befund besagt:** Der **Entwicklungsserver von esbuild** nimmt Anfragen
beliebiger Webseiten an und gibt die Antwort preis.

**Warum nicht anwendbar:** In diesem Projekt läuft kein esbuild-Entwicklungsserver.
`drizzle-kit` nutzt esbuild nur, um beim Erzeugen von Migrationen die
Schemadatei zu übersetzen; `vitest` übersetzt damit Testdateien. Beides sind
kurzlebige Vorgänge ohne offenen Port. Der Entwicklungsserver der Anwendung
ist Next mit Turbopack und hat mit esbuild nichts zu tun.

**Folge:** namentlich ausgenommen in `.github/workflows/sicherheit-taeglich.yml`.
Ein zweiter Schritt zeigt im selben Lauf alle Befunde ungefiltert in der
Zusammenfassung — die Nummer verschwindet also nicht aus dem Blick. Sobald
`drizzle-kit` oder `vitest` ein esbuild über 0.24.2 mitbringen, fällt die
Ausnahme weg.

## Im Produkt

- Serverseitige Sitzungen in PostgreSQL; das Cookie trägt nur die ID
- Cookies `httpOnly`, `sameSite=lax`, `secure` in Produktion
- Sitzungs-ID wird bei jeder Anmeldung neu erzeugt (gegen Session Fixation)
- Argon2id mit ausdrücklich gesetzten Parametern (19 MiB, 3 Durchgänge)
- Rate-Limit auf der Anmeldung: 5 Fehlversuche je 15 Minuten und Herkunft,
  Zähler in der Datenbank, nur Hash der Herkunft gespeichert, erfolgreiche
  Anmeldungen zählen nicht mit
- Gleiche Fehlermeldung für «kein Konto», «falsches Passwort» und
  «deaktiviert» — sonst lässt sich über die Maske herausfinden, welche
  Adressen registriert sind
- Zwei Datenbankrollen: Eigentümer migriert, Anwendung arbeitet. Eigentümer
  und Superuser umgehen Row Level Security
- Konfiguration wird beim Start validiert; fehlt ein Wert, bricht die
  Anwendung ab. Kein Vorgabewert für Zugangsdaten
- Sicherheits-Header in `next.config.ts`
- Geheimnisse nur in Umgebungsvariablen, `.env*` in `.gitignore`

## Schlüssel und Missbrauch

Das grösste Risiko dieser Anwendung ist nicht die Anmeldung, sondern der
API-Schlüssel hinter einer öffentlich erreichbaren Demo.

**Faustregel:** Echt bauen, was den Betreiber schützt — Schlüssel, Server,
Kosten. Dokumentieren statt bauen, was nur hypothetische Nutzer schützt.

| Massnahme                                                                      | Wo                | Stand   |
| ------------------------------------------------------------------------------ | ----------------- | ------- |
| Eigener Schlüssel nur für diese Anwendung, nie ein privater Mehrzweckschlüssel | Anthropic Console | Tag 4   |
| Harte Ausgabengrenze für diesen Schlüssel, ausserhalb des eigenen Codes        | Anthropic Console | Tag 4   |
| Monatsdeckel in der Anwendung                                                  | Server            | Tag 4   |
| Tagesdeckel für die ganze Anwendung                                            | Server            | Tag 4   |
| Fragen je Sitzung begrenzt (Startwert 10)                                      | Server            | Tag 4   |
| Token-Obergrenze je Antwort (1200)                                             | Server            | Tag 4   |
| Ausgaben je Aufruf in `usage_events` protokolliert                             | Datenbank         | Tag 4   |
| Upload nur für angemeldete Nutzer, Demo fragt an vorbereitetem Korpus          | Server            | Tag 5   |
| Injektionsabwehr                                                               | Server            | Tag 4/5 |

Der Schlüssel verlässt den Server nie: nicht im Bundle, nicht in einer
API-Antwort, nicht in einer Fehlermeldung. Eine erreichte Grenze erzeugt eine
freundliche Meldung, keinen Fehlerzustand — wer gegen ein Budget läuft, hat
nichts falsch gemacht.

## Noch offen

- Content Security Policy ohne `unsafe-inline` bei Skripten (kommt mit der
  ausgearbeiteten Oberfläche)
- Prompt-Injection-Testfälle (Tag 5)
- Abwehr gegen manipulierte Quellen-IDs (Tag 4, mit der Belegprüfung)
