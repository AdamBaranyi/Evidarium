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

## Tag 3 — Suche · **fertig** (17.09.2026)

| Punkt                                                          | Stand                      |
| -------------------------------------------------------------- | -------------------------- |
| Lokale Embeddings im Worker, Modell genau einmal geladen       | fertig                     |
| `vector(384)` mit HNSW-Index, Kosinus                          | fertig                     |
| Zwei generierte `tsvector`-Spalten (deutsch, englisch) mit GIN | fertig                     |
| Interner Endpunkt `127.0.0.1:3101` für Fragevektoren           | fertig                     |
| Hybridsuche mit Reciprocal Rank Fusion, k = 60                 | fertig                     |
| Kappung nie ohne Sortierung                                    | fertig                     |
| Messwerte in `docs/BETRIEB.md`                                 | fertig, Zielmaschine offen |

**Nachweis vom 17.09.2026:**

- «Wer hilft beim Onboarding?», «Who helps with onboarding?» und die
  Umschreibung «Wer betreut neue Mitarbeitende beim Einstieg?» liefern alle
  denselben Abschnitt auf Platz eins — Seite 2, wo er hingehört
- Ein Abschnitt, den beide Verfahren finden, bekommt die doppelte Punktzahl
  und steht klar vorn
- Fremde Dokument-IDs liefern nichts, auch wenn sie gültig sind
- Modell lädt genau einmal; der interne Endpunkt ist über die LAN-Adresse
  nicht erreichbar
- 26 Tests, davon 7 für die Suche

## Tag 4 — Antwort mit Belegen · **fertig** (17.09.2026)

| Punkt                                                      | Stand  |
| ---------------------------------------------------------- | ------ |
| Provider-Schnittstelle, Demo-Adapter ohne stillen Rückfall | fertig |
| Anthropic-Adapter mit erzwungenem Ausgabeformat            | fertig |
| **Belegprüfung**: Quellen-ID und Zitat, beide hart         | fertig |
| Vier Kategorien, Kategorie muss zu den Belegen passen      | fertig |
| Budget: Reservierung, Tages- und Monatsdeckel, Kontingent  | fertig |
| Ausgabenprotokoll mit datierter Preistabelle               | fertig |
| Chat-Oberfläche mit echten Arbeitsschritten                | fertig |
| Quellen-Panel: ganzer Abschnitt, Zitat markiert            | fertig |
| Seite «Verbrauch» mit Deckeln und letzten Aufrufen         | fertig |

**Nachweis vom 17.09.2026, im Live-Modus gegen `claude-haiku-4-5`:**

- «Wer betreut neue Mitarbeitende am Anfang?» ergibt _belegt_ mit dem Zitat
  «Beim Onboarding hilft Mara Keller.» aus `teamhandbuch.pdf`, Seite 2
- Das Modell schreibt «Zugänge» mit Umlaut, zitiert aber «Zugaenge» — so wie
  es im Dokument steht. Hätte es geglättet, wäre die Antwort verworfen worden
- «Welche Regeln gelten für Ferien und Abwesenheiten?» ergibt _keine
  Grundlage_ statt einer erfundenen Auskunft
- Gemessene Schritte: Einbetten und Suche je unter 0,05 s, Modellaufruf 3,9 s,
  Belegprüfung unter 0,05 s
- Ausgabenprotokoll: 3 Aufrufe, 0,0158 von 2,00 USD am Tag, Kontingent 2 von 10
- 320 px: kein waagrechter Überlauf, keine Meldung in der Browserkonsole
- 64 Tests

## Als Nächstes

Tag 5: Evaluationsset mit 12 Fällen gegen einen erfundenen Korpus,
Prompt-Injection-Test, öffentliche Demo mit vorbereitetem Korpus (Upload nur
für angemeldete Personen), drei Testbreiten, Fallstudie, Deployment auf vps1.

## Tag 5 — Evaluation, Demo, Deployment · **in Arbeit**

| Punkt                                                    | Stand  |
| -------------------------------------------------------- | ------ |
| Korpus «Nordstern Digital», reproduzierbar erzeugt       | fertig |
| Zwölf versionierte Prüffälle                             | fertig |
| Prüfer als reine Funktion, mit eigenen Tests             | fertig |
| Prompt-Injection: markiert **und** unmarkiert            | fertig |
| Protokoll `docs/EVALUATION.md` mit Antworten im Wortlaut | fertig |
| Öffentliche Demo, Upload nur für angemeldete Personen    | fertig |
| Drei Prüfbreiten als Test, auch in der CI                | fertig |
| Löschkaskade für Dokumente, mit Oberfläche               | fertig |
| Fallstudie `docs/FALLSTUDIE.md`                          | fertig |
| Deployment auf vps1                                      | offen  |

**Nachweis vom 17.09.2026, Live-Modus:** 12 von 12 Fällen bestanden, 48,6 s,
0,0357 USD. Beide Konfliktfälle nennen 30 **und** 90 Tage mit je eigener
Quelle und lösen den Widerspruch nicht auf. Kein Vorkommen des Freigabeworts
aus der unmarkierten Injektion. Gegenprobe: erwartete Seite absichtlich
verfälscht, Fall scheitert mit «Fundstelle fehlt».

**Demo vom 18.09.2026:** `/demo` beantwortet Fragen ohne Anmeldung gegen
denselben Korpus, gegen den die Evaluation läuft. Die Auswahl setzt der
Server, es gibt keinen Upload und keinen Gesprächsverlauf. Nachgewiesen im
Browser: «Wie lange werden Sicherungen aufbewahrt?» ergibt den Widerspruch mit
beiden Quellen, 3,5 s, 0,0037 USD. 24 E2E-Prüfungen auf 320, 768 und 1440 —
jetzt auch in der CI, vorher nur auf dem Entwicklungsrechner. 81 Tests.

Befehle: `bun scripts/korpus-erzeugen.ts` erzeugt den Korpus,
`bun --env-file=.env scripts/evaluieren.ts` prüft; einzelne Fälle über
`… scripts/evaluieren.ts E09 E10`.
`bun --env-file=.env scripts/demo-korpus-laden.ts` befüllt das Demo-Konto.

## Nach Tag 5 — Visuelle Identität

Entscheid vom 17.09.2026: **Das Design ist Rohbau und bleibt es bis nach
Tag 5.** Erst Evaluation, Injektionstest, Demo, Fallstudie und Deployment;
danach ein eigener Durchgang für eigene Farbe, eigene Schrift, eigenes Raster.

Was dabei gilt und was nicht:

- Die **Regel** steht schon: Farbe ist dem Beleg vorbehalten, Knöpfe tragen
  Tinte. Der **Wert** `--beleg: #0a6b5d` ist ein Platzhalter.
- **Kein KI-Standard**: kein Verlauf-Violett, keine Glaskarten, keine
  generischen Icon-Reihen. Ein Prüflauf gegen diese Merkmale gehört dazu.
- Die **Anmeldeseite soll leben** und nicht nur ein Formular sein. Sparsam und
  selbst gebaut, inhaltlich begründet statt dekorativ.
- Kein Gewand von einem anderen Portfolio-Projekt übernehmen. Zwei Apps im
  selben Kleid sehen nach Vorlage aus.
- Die 16-px-Untergrenze und die drei Prüfbreiten gelten unverändert weiter.

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
- **`websearch_to_tsquery` verknüpft alle Wörter mit UND.** Bei einer
  natürlichen Frage trifft die Volltextsuche damit nie — und es fällt nicht
  auf, weil die semantische Hälfte Ergebnisse liefert. Siehe E15.
- **`voyage-4-nano` hat keine ONNX-Fassung** und läuft darum nicht in
  transformers.js, obwohl es «auf CPU läuft». Siehe E14.
- Drizzle entfaltet ein JS-Array im SQL-Template zu einer Parameterliste;
  daraus wird ein Record, kein Array. `ANY(...)` braucht einen einzelnen
  Textparameter mit `string_to_array`.
- Drizzle nimmt beim Einfügen in eine `vector`-Spalte ein Zahlen-Array, kein
  Literal — das Literal braucht erst die rohe Suchabfrage.
- **Eine Behauptung in der Dokumentation ist kein Nachweis.** Das README
  nannte die Löschkaskade seit Tag 1 «gebaut und getestet»; gebaut war nur die
  Spalte `deleted_at`. Aufgefallen beim Nachprüfen der eigenen Sätze vor dem
  Veröffentlichen der Fallstudie. Siehe E28.
- **Ein `useState`-Updater muss rein sein.** `Date.now()` darin wird beim
  erneuten Aufruf des Updaters neu ausgewertet; alle gemessenen Schrittzeiten
  standen darum auf 0,0 s. Die Uhr vor dem Aufruf ablesen. Siehe E20.
- **Tests dürfen nicht von einer eingelesenen `.env` abhängen.** `STORAGE_PATH`
  war in Tag 2 ins Schema gekommen, aber nicht in `vitest.config.ts` und nicht
  in die CI. Lokal lief alles, weil vor jedem Lauf `.env` eingelesen wurde;
  in der CI brach die Konfigurationsprüfung ab. Jede Pflichtvariable aus
  `src/lib/config/env.ts` gehört in beide.

## Blockiert

Nichts.
