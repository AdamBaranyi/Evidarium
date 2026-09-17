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
