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

## Ausnahmen

Regel seit dem 10.10.2026: Eine Ausnahme gilt für genau eine GHSA-Nummer, nie
für eine ganze Stufe. Sie steht mit ihrer Kennung in `scripts/audit.sh` — der
einen Stelle, die CI und täglicher Lauf nutzen — und hier mit Paket, Stufe,
Art, Grund, Datum und «prüfen bis», höchstens einen Monat voraus. Die
monatliche Erinnerung prüft die Liste, ein Test hält Skript und diese Datei
gleich. Fällt ein Befund weg, fällt seine Ausnahme weg.

### GHSA-67mh-4wv8-2f99 — esbuild ≤ 0.24.2

- **Paket:** `esbuild` 0.18.20 über
  `drizzle-kit → @esbuild-kit/esm-loader → @esbuild-kit/core-utils`. `bun audit`
  nennt zusätzlich einen Weg über `tsx`; der bringt aber esbuild 0.28 mit und
  ist nicht betroffen.
- **Stufe:** moderat
- **Art:** Werkzeug, keine Laufzeit
- **Grund:** Der Befund betrifft den Entwicklungsserver von esbuild, der
  Anfragen beliebiger Webseiten annimmt und die Antwort preisgibt. In diesem
  Projekt läuft keiner: `drizzle-kit` übersetzt mit esbuild nur beim Erzeugen
  von Migrationen die Schemadatei, ein kurzer Vorgang ohne offenen Port. Der
  Entwicklungsserver der Anwendung ist Next mit Turbopack.
- **Kein Update:** Auch das neueste `drizzle-kit` (0.31.11) hängt noch an
  `@esbuild-kit`.
- **Bewertet:** 17.09.2026, nachgeprüft 10.10.2026
- **Prüfen bis:** 10.11.2026

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
- Das Ausgabenprotokoll führt **nicht** die Sitzungs-ID, sondern deren Hash:
  Das Anmeldegeheimnis gehört in die Sitzungstabelle und sonst nirgendwohin.
  Die Kennung ist serverseitig abgeleitet, also vom Client nicht wählbar
- `/api/chat` prüft die Herkunft wie der Upload und antwortet erst nach der
  Sitzungsprüfung; die Dokumentauswahl aus dem Browser ist ein Wunsch, keine
  Berechtigung — die Abfragen filtern zusätzlich auf den Nutzer
- **Öffentliche Demo** (`DEMO_AKTIV`, standardmässig aus): Die
  Dokumentauswahl setzt der Server, nicht der Client; kein Upload, kein
  Gesprächsverlauf. Zwei Zähler je Besuch und je Herkunft, beide über einen
  Hash — weder IP noch Cookie-Wert landen in der Datenbank. Beide sind
  umgehbar und stehen als das da, was sie sind; die Schranke, die hält, ist
  der Tagesdeckel in Dollar. Siehe E26.
- **Eigene Dateien in der Demo**: höchstens 3 je Besuch, 2 MiB, 10 Seiten,
  automatische Löschung nach 24 Stunden über die vollständige Löschkaskade.
  Der Hinweis darauf steht **vor** dem Formular. Die Trennung läuft über den
  Hash des Besuchercookies; die Dokumentliste stellt der Server zusammen.
  Siehe E34.
- **Content Security Policy** mit Nonce je Anfrage (`src/proxy.ts`), ohne
  `unsafe-inline` bei Skripten; Stilattribute erlaubt, Stilelemente nicht.
  Im Browser geprüft: null Verstösse auf allen Seiten, und eine Gegenprobe mit
  eingeschleustem HTML wird blockiert und gemeldet (`e2e/csp.spec.ts`)
- Anmeldung prüft **immer gleich lang**: ohne Konto gegen einen Schein-Hash,
  sonst verriete die Laufzeit, welche Adressen existieren
- Anfragegrösse vor dem Lesen begrenzt, dazu `request_body` im Caddy-Auszug
- Demo-Uploads auch **je Herkunft** (10 am Tag) und **gesamt** (300) begrenzt;
  das Cookie allein wäre durch Löschen zu umgehen
- IP-Hashes nach 24 Stunden entfernt, abgelaufene Sitzungen und alte
  Anmeldeversuche aufgeräumt — im selben geplanten Auftrag
- `security.txt` nach RFC 9116; `Expires` fest auf den 21.09.2027
- Sicherheits-Header in `next.config.ts`
- Geheimnisse nur in Umgebungsvariablen, `.env*` in `.gitignore`

## Behobene Befunde

### Oktober-Welle: next, sharp, source-map-js · **behoben 10.10.2026**

Neun Befunde, drei davon «hoch». Im Audit erschienen sie ab dem 05.10.2026:
source-map-js (gemeldet am 18.09., von GitHub erst am 05.10. geprüft), sharp
am 06.10., next am 07.10. Der tägliche Lauf war ab dem 06.10.2026 rot.

| Nummer              | Paket und Befund                             | Stufe   | Art                           | Behoben mit           |
| ------------------- | -------------------------------------------- | ------- | ----------------------------- | --------------------- |
| GHSA-cjq9-62q9-8jv4 | next, SSRF in der Bildoptimierung            | hoch    | Laufzeit                      | `next` 16.3.8         |
| GHSA-f87g-xv8r-7p7x | next, Metadaten-Bildrouten                   | moderat | Laufzeit                      | `next` 16.3.8         |
| GHSA-mcj8-r9mp-w47p | next, Cache bei SSG und ISR                  | moderat | Laufzeit                      | `next` 16.3.8         |
| GHSA-3w37-wq28-93x7 | next, Draft Mode im Cache                    | moderat | Laufzeit                      | `next` 16.3.8         |
| GHSA-4jqv-mc3x-m676 | next, Cache bei SSG und ISR, selbst gehostet | moderat | Laufzeit                      | `next` 16.3.8         |
| GHSA-39w2-rjm5-chcv | next, MCP-Endpunkt des Entwicklungsservers   | niedrig | Werkzeug                      | `next` 16.3.8         |
| GHSA-wq5f-xc86-pv6w | sharp, librsvg in libvips                    | hoch    | Laufzeit (transformers, next) | `sharp` 0.35.5        |
| GHSA-68fv-2mgg-jv7q | source-map-js, Denial of Service             | hoch    | Werkzeug (Build)              | `source-map-js` 1.2.2 |

**Wie:** `next` direkt angehoben, `sharp` und `source-map-js` nur im Lockfile,
weil alle Abhängigen die Korrektur erlauben (`^0.35.4`, `^1.2.1`). Der Override
auf `sharp` 0.35.4 vom 17.09.2026 ist entfernt: Er schützte vor sharp < 0.35.0,
das verlangt heute niemand mehr, und er hätte jedes weitere sharp-Update
eingefroren.

**Keine Wartezeit-Ausnahme nötig:** Die Fassungen waren schon älter als sieben
Tage — `next` 16.3.8 vom 30.09., `sharp` 0.35.5 vom 27.09., `source-map-js`
1.2.2 vom 30.09.2026.

**Geprüft:** `bun audit` ohne Befund ausser der esbuild-Ausnahme, Build mit
Next 16.3.8, sharp lädt (libvips 8.18.7), das Embedding-Modell bettet ein
(384 Dimensionen, Ähnlichkeit derselben Testfrage wie am 30.09.2026).

### GHSA-qhr7-859c-m2p7, GHSA-6j4f-fj2g-mc7p, GHSA-q2hr-2g5m-vwhr — brace-expansion · **behoben 30.09.2026**

Drei Meldungen vom 29.09.2026, zwei «hoch», eine «moderat»: Verschachtelte
Klammern in einem Muster treiben `brace-expansion` in einen Stapelüberlauf oder
in quadratische Rechenzeit — Denial of Service. Der tägliche Lauf schlug am
30.09.2026 an.

**Woher:** nur über Entwicklungswerkzeuge —
`eslint → @eslint/config-array → minimatch 10 → brace-expansion 5.0.9` und
`eslint-plugin-jsx-a11y → minimatch 3 → brace-expansion 1.1.18`. Die Muster
stammen aus der eigenen Lint-Konfiguration, nie von Nutzern.

**Behoben:** Kein Override nötig, die Bereiche `^5.0.8` und `^1.1.7` erlauben
die Korrekturen bereits. Nur die beiden Einträge in `bun.lock` gehoben, auf
5.0.12 und 1.1.21 — beide seit dem 14.09.2026 veröffentlicht, also älter als die
Wartezeit. Danach `bun install --frozen-lockfile` ohne Änderung,
`bun audit --audit-level=moderate` ohne Befund ausser der benannten Ausnahme,
Lint läuft.

**Lehre:** `bun update brace-expansion` hebt ein transitives Paket nicht an. Es
macht daraus eine direkte Abhängigkeit und lässt die verschachtelte Kopie auf
der alten Version. Bei transitiven Paketen den Eintrag im Lockfile heben, wenn
der Bereich es erlaubt, sonst ein eng gefasstes Override.

### GHSA-vwc7-r8mq-g2x9 — adm-zip ≤ 0.6.0 · **behoben 18.09.2026**

Über `@huggingface/transformers → onnxruntime-node → adm-zip`. Beim Entpacken
folgte adm-zip symbolischen Links im Zielpfad.

Die Behebung lag ab dem 17.09.2026 vor, war aber sechs Tage alt und scheiterte
an der Wartezeit aus `bunfig.toml` — genau so gewollt. Die Ausnahme war darum
**befristet und mit Datum** eingetragen, im Workflow und hier.

Am 18.09.2026, ab 12:24 Uhr, war 0.6.1 installierbar: `overrides` gehoben, die
Ausnahme samt `--ignore` entfernt, `bun audit --audit-level=moderate` ohne
Befund, und nachgeprüft, dass das Embedding-Modell weiterhin lädt.

**Lehre:** «Ab dem 18.09.2026» war zu ungenau. Die Wartezeit rechnet in
Sekunden ab Veröffentlichung, nicht in Kalendertagen; der erste Versuch am
Morgen scheiterte noch. Ein befristeter Eintrag gehört mit Uhrzeit versehen.

Nicht ausgenommen, sondern behoben — über eng gefasste `overrides` in
`package.json` (der für `sharp` ist seit dem 10.10.2026 entfernt, siehe oben):

| Nummer              | Paket           | Weg                                 | Behoben mit     |
| ------------------- | --------------- | ----------------------------------- | --------------- |
| GHSA-f88m-g3jw-g9cj | sharp < 0.35.0  | `@huggingface/transformers → sharp` | `sharp` 0.35.4  |
| GHSA-rgj7-g3m4-5g8c | sharp < 0.35.0  | dito, libheif                       | `sharp` 0.35.4  |
| GHSA-xcpc-8h2w-3j85 | adm-zip < 0.6.0 | `onnxruntime-node → adm-zip`        | `adm-zip` 0.6.0 |

Nach dem Anheben geprüft: Das Embedding-Modell lädt weiterhin und liefert
384 Dimensionen. Ein Override, der die Anwendung bricht, wäre keine Behebung.

## Schlüssel und Missbrauch

Das grösste Risiko dieser Anwendung ist nicht die Anmeldung, sondern der
API-Schlüssel hinter einer öffentlich erreichbaren Demo.

**Faustregel:** Echt bauen, was den Betreiber schützt — Schlüssel, Server,
Kosten. Dokumentieren statt bauen, was nur hypothetische Nutzer schützt.

| Massnahme                                                                      | Wo                | Stand     |
| ------------------------------------------------------------------------------ | ----------------- | --------- |
| Eigener Schlüssel nur für diese Anwendung, nie ein privater Mehrzweckschlüssel | Anthropic Console | Tag 4     |
| Harte Ausgabengrenze für diesen Schlüssel, ausserhalb des eigenen Codes        | Anthropic Console | Tag 4     |
| Monatsdeckel in der Anwendung                                                  | Server            | Tag 4     |
| Tagesdeckel für die ganze Anwendung                                            | Server            | Tag 4     |
| Fragen je Sitzung begrenzt (Startwert 10)                                      | Server            | Tag 4     |
| Token-Obergrenze je Antwort (1200)                                             | Server            | Tag 4     |
| Ausgaben je Aufruf in `usage_events` protokolliert                             | Datenbank         | Tag 4     |
| Upload nur für angemeldete Nutzer, Demo fragt an vorbereitetem Korpus          | Server            | **steht** |
| Injektionsabwehr                                                               | Server            | Tag 4/5   |
| Quellen-ID und Zitat serverseitig geprüft, Metadaten nie aus der Modellausgabe | Server            | Tag 4     |

Der Schlüssel verlässt den Server nie: nicht im Bundle, nicht in einer
API-Antwort, nicht in einer Fehlermeldung. Eine erreichte Grenze erzeugt eine
freundliche Meldung, keinen Fehlerzustand — wer gegen ein Budget läuft, hat
nichts falsch gemacht.

## Noch offen
