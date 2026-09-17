# Entscheide

Nummeriert und nie gelöscht. Überholte Entscheide bekommen einen Nachtrag,
sie verschwinden nicht.

## E1 — Next.js statt Vite und Express

_17.09.2026._ Oberfläche, Server-Endpunkte und Rendern liegen in einem
Projekt. Der Worker bleibt trotzdem ein eigener Prozess: Er darf nicht an
einer Web-Anfrage hängen.

## E2 — Bun als Paketmanager, Node als Laufzeit für Next

_17.09.2026._ Die Bun-Runtime mit Turbopack löst mehrfache
Fast-Refresh-Rebuilds aus. Bun installiert also, `next` läuft auf Node.

## E3 — Embeddings lokal, Antworten über eine Schnittstelle

_11.09.2026, bestätigt 17.09.2026._ Dokumente verlassen den Server nicht; das
ist Datenschutzargument und Kostenargument zugleich, denn Einlesen kostet dann
nichts. Antworten lokal auf CPU zu erzeugen wäre langsam und schlechter —
dafür eine Schnittstelle mit eigenem Schlüssel und hartem Monatsdeckel.

## E4 — Das Embedding-Modell wird genau einmal geladen

_17.09.2026._ Es wird beim Einlesen **und** bei jeder Frage gebraucht. Lädt es
auch die Weboberfläche, liegt es doppelt im Speicher (4 statt 2 GB). Es lebt
darum nur im Worker; die Oberfläche fragt über einen internen Endpunkt auf
`127.0.0.1`.

## E5 — PostgreSQL 18 mit pgvector

_17.09.2026._ Hauptversion an die Zielmaschine angeglichen, wo
`postgres:18.1-alpine` läuft. CI, Entwicklung und Produktion fahren dieselbe
Hauptversion. Image `pgvector/pgvector:0.8.6-pg18`, gepinnt.

## E6 — Zwei Datenbankrollen

_17.09.2026._ Eigentümer und Superuser umgehen Row Level Security. Der
Eigentümer wandert durch die Migrationen, die Anwendung arbeitet mit der
eingeschränkten Rolle — auch jetzt schon, wo es noch keine RLS gibt.

## E7 — Ports 5450 und 5451

_17.09.2026._ Tallyroom belegt auf derselben Maschine 5440 und 5441.

## E8 — Kein Werkzeug-Hinweis im Repository

_17.09.2026._ `.claude/`, `AGENTS.md` und `CLAUDE.md` stehen in
`.git/info/exclude`, nicht in `.gitignore` — der Ausschluss ist lokal und
taucht im öffentlichen Repository nicht auf. Dazu `agentRules: false` in
`next.config.ts`, sonst schreibt `next dev` verwaltete Blöcke in diese Dateien.

## E9 — TypeScript 6, nicht 7

_17.09.2026._ TypeScript 7 ist der in Go neu gebaute Compiler: mehr Tempo,
keine Funktion, keine Sicherheit. Im Schwesterprojekt Tallyroom scheiterte der
Typecheck damit. Hauptversionssprünge sind in `dependabot.yml` gesperrt;
Patches innerhalb von 6.x kommen weiter.

## E10 — Kein Zwei-Faktor, kein Identitätsdienst; dafür harte Budgetgrenzen

_17.09.2026._ Echt bauen, was den Betreiber schützt; dokumentieren statt bauen,
was nur hypothetische Nutzer schützt.

Zwei-Faktor vor einem öffentlich dokumentierten Demo-Zugang schützt nichts. Was
wirklich Geld kostet, ist ein abgeflossener oder leergefragter API-Schlüssel.
Die Mühe geht darum in Budgetgrenzen je Sitzung, je Tag und je Monat, in einen
eigenen Schlüssel nur für diese Anwendung mit harter Grenze in der Console, und
darin, dass Hochladen angemeldeten Nutzern vorbehalten bleibt.

Ein zentraler Identitätsdienst wäre für eine Demo Betriebsaufwand und ein
zusätzlicher Ausfallpunkt. Er kommt mit echten Nutzern, dann als **zweiter**
Anmeldeweg neben der lokalen Anmeldung.

Jede dieser Auslassungen steht mit Begründung in `README.md` unter «Bewusst
nicht gebaut». Begründete Lücken lesen sich als Urteilsvermögen, ungenannte als
Unwissen.

## E11 — Jobqueue: pg-boss 12.30.0

_17.09.2026._ Eine Warteschlange im Arbeitsspeicher geht bei jedem Neustart und
jedem Deploy verloren; Dokumente hängen dann für immer in «wird verarbeitet»,
ohne dass irgendwo ein Fehler auftaucht.

Gewählt wurde **pg-boss 12.30.0** (MIT) gegenüber `graphile-worker`: einfachere
Schnittstelle für diesen Zweck, legt seine Tabellen im Schema `pgboss` selbst an
und wandert selbst durch seine Migrationen. Kein Redis, kein zweiter Dienst.

Nicht die neueste Fassung: 12.33.0 war am Tag der Auswahl null Tage alt und wäre
an der Sieben-Tage-Wartezeit aus `bunfig.toml` hängen geblieben. pg-boss
veröffentlicht häufig — Dependabot bündelt das wöchentlich zu einem Sammel-PR.

## E12 — PDF-Extraktion: unpdf 1.8.1

_17.09.2026._ `extractText(pdf, { mergePages: false })` liefert ein Array mit
einem Eintrag je Seite. Genau das braucht der Beleg: **ohne Seitenzahl gibt es
keine anklickbare Fundstelle**, und damit kein Produkt.

**Fallstrick, gefunden und abgesichert:** pdf.js übernimmt den übergebenen
Puffer und koppelt ihn ab — nach dem ersten Aufruf ist `byteLength` null, und
ein zweiter Aufruf meldet «beschädigt» für eine einwandfreie Datei. Die
Extraktion übergibt darum eine Kopie. Regressionstest in
`tests/extraktion.test.ts`.

## E13 — Typerkennung ohne Fremdpaket

_17.09.2026._ Drei Formate, darum keine Bibliothek: PDF an den ersten fünf Bytes
(`%PDF-`), Text über strikte UTF-8-Dekodierung. Markdown wird am Dateinamen
unterschieden — es _ist_ Text, der Name entscheidet nur über die Anzeige, nie
über die Sicherheit.

Erlaubt sind die Steuerzeichen Tabulator, Zeilenumbruch, Wagenrücklauf **und
Seitenvorschub**. Letzterer ist der klassische Seitentrenner in Textdateien;
ohne ihn lehnt die Prüfung gültige Dokumente ab — beim ersten eigenen
Testdokument sofort passiert.
