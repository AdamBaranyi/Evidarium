# Betrieb

## Prozesse

| Prozess                  | Start                                              | Aufgabe                                                   |
| ------------------------ | -------------------------------------------------- | --------------------------------------------------------- |
| Web                      | `bun run dev` / `bun run start`                    | Oberfläche, Server Actions, Route Handler                 |
| Worker                   | `bun run worker`                                   | Einlesen, Einbetten, interner Endpunkt auf 127.0.0.1:3101 |
| PostgreSQL 18 + pgvector | `docker compose -f infra/docker-compose.yml up -d` | Daten, Vektoren, Volltext, Jobqueue                       |

Beide Anwendungsprozesse zusammen: `bun run dev:all`.

**Der Worker muss laufen, bevor eine Frage gestellt wird.** Er hält als
einziger das Embedding-Modell; ohne ihn kann der Web-Prozess keine Frage in
einen Vektor umrechnen und meldet «Worker nicht erreichbar» statt eines
stillen Fehlers.

## Migrationen

```bash
bun run db:generate   # Schema geändert -> Migrationsdatei erzeugen
bun run db:migrate    # einspielen, läuft als Eigentümerrolle
```

Migrationen laufen als `evidarium_owner`, die Anwendung arbeitet als
`evidarium_app`. Die Anwendungsrolle darf keine Tabellen anlegen — das ist
beabsichtigt, siehe `docs/ENTSCHEIDE.md`, E6.

## Konten

Es gibt kein öffentliches Registrierungssystem. Konten entstehen über einen
lokalen Befehl auf der Maschine, auf der die Anwendung läuft:

````bash
bun run konto:anlegen adam@example.test

## Deployment auf vps1

Checkout nach `/opt/evidarium` (oeffentliches Repository, kein Deploy-Key),
dann:

```bash
sudo /opt/evidarium/infra/deploy.sh          # Stand `main`
sudo /opt/evidarium/infra/deploy.sh <commit> # bestimmter Stand
```

Der erste Lauf legt `infra/.env.production` an (erzeugte Passwoerter, `chmod
600`) und hoert dort auf. Darin pruefen: `APP_ORIGIN`, und falls echte
Antworten gewuenscht sind, `ANTHROPIC_API_KEY` eintragen und `AI_MODE=live`
setzen. Danach denselben Befehl noch einmal.

Jeder weitere Lauf: Stand holen, Abbild bauen, **Datenbank sichern**, dann
migrieren und neu starten. Die Sicherung entsteht vor der Migration, nicht
danach — eine Sicherung nach dem Schemaumbau hilft beim Zurueckrollen nicht.
Sie liegt unter `/var/backups/evidarium`.

Danach:

```bash
docker compose -f infra/compose.prod.yml --env-file infra/.env.production \
  exec web bun scripts/konto-anlegen.ts <e-mail>
docker compose -f infra/compose.prod.yml --env-file infra/.env.production \
  exec worker bun scripts/demo-korpus-laden.ts
```

Caddy: Auf vps1 besitzt der Caddy aus dem Compose von Tallyroom die Ports 80
und 443. Evidariums Webdienst haengt darum in dessen Netz (`proxy`, extern,
Vorgabe `tallyroom-prod_default`) und ist dort als `evidarium-web` erreichbar;
Datenbank und Worker bleiben im eigenen Netz. Der Adressblock steht in
Tallyrooms `infra/Caddyfile`; `infra/caddy/evidarium.caddy` ist die Vorlage
dafuer. `flush_interval -1` ist noetig, sonst puffert der Proxy den
Antwortstrom und die Schrittanzeige kommt am Stueck. Zieht der Proxy einmal um,
genuegt `PROXY_NETZ` in `infra/.env.production`.

**Fallstrick:** `docker compose --env-file` ueberschreibt nichts, was schon in
der Umgebung steht. Wer vorher `.env` eingelesen hat, faehrt still gegen die
falsche Datenbank. `deploy.sh` entfernt die betroffenen Variablen darum
selbst.

## Monatlich

- **Verbrauch und Guthaben prüfen.** Die Seite «Verbrauch» zeigt den Stand
  von Tages- und Monatsdeckel und die letzten Aufrufe mit geschätzten Kosten.
  Das Restguthaben steht nur in der Konsole von Anthropic; ist es leer,
  antwortet Evidarium nicht mehr, sondern meldet einen Fehler — ein stiller
  Rückfall auf den Demo-Modus wäre schlimmer als eine ehrliche Meldung.
- **Sicherung zurückspielen proben:** `sudo /opt/evidarium/infra/sicherung-pruefen.sh`.

## Jaehrlich

- **`security.txt` erneuern** vor dem 21.09.2027: Datum in
  `src/app/.well-known/security.txt/route.ts` heben. Ein abgelaufenes
  `Expires` heisst fuer Sicherheitsforschende: Die Kontaktangabe ist nicht
  mehr gepflegt.

## Oeffentliche Demo

```bash
bun --env-file=.env scripts/demo-korpus-laden.ts   # Demo-Konto befuellen
```

Danach `DEMO_AKTIV=true` setzen und die Anwendung neu starten. In Produktion
verlangt die Konfigurationspruefung zusaetzlich `TRUST_PROXY=true` — ohne sie
haetten hinter einem Reverse Proxy alle Besucher dieselbe Herkunft, und das
Limit je Herkunft zaehlte alle als einen.

Die Demo laeuft auf demselben Schluessel und demselben Tagesdeckel wie der
angemeldete Betrieb. Wer den Deckel erreicht, sperrt beide — das ist gewollt:
ein Deckel, zwei Wege, keine getrennte Buchhaltung.

## Evaluation

```bash
bun scripts/korpus-erzeugen.ts              # Korpus neu erzeugen (selten noetig)
bun --env-file=.env scripts/evaluieren.ts   # zwoelf Prueffaelle, schreibt docs/EVALUATION.md
bun --env-file=.env scripts/evaluieren.ts E09 E10   # einzelne Faelle nachstellen
````

Der Worker muss laufen: Die Fragevektoren kommen ueber seinen internen
Endpunkt. Im Live-Modus kostet ein voller Lauf rund 0,04 USD und zaehlt auf
Tages- und Monatsdeckel. Das Sitzungskontingent gilt nicht — ein Prueflauf ist
keine Besuchersitzung.

````

Derselbe Befehl setzt das Passwort eines bestehenden Kontos neu.

## Messwerte

**Gemessen am 17.09.2026 auf dem Entwicklungsrechner** (Apple Silicon, Bun
1.3.14, Modell `intfloat/multilingual-e5-small`, fp32, Stapelgrösse 16).

| Vorgang                                | Zeit    | Speicher             |
| -------------------------------------- | ------- | -------------------- |
| Modell laden, erster Lauf mit Download | 15,6 s  | —                    |
| Modell laden aus dem Cache             | 0,5 s   | RSS 78 → 1636 MB     |
| 100 Abschnitte einbetten               | 4,9 s   | 48,9 ms je Abschnitt |
| 500 Abschnitte einbetten               | 25,2 s  | 50,3 ms je Abschnitt |
| 1000 Abschnitte einbetten              | 53,4 s  | 53,4 ms je Abschnitt |
| Eine Frage einbetten                   | 3,7 ms  | —                    |
| Hybridsuche über 7 Abschnitte          | 2–16 ms | —                    |

Der Verbrauch pendelt sich nach dem Laden bei rund **1,25 GB RSS** ein; die
1636 MB sind die Spitze beim Laden. Das Einbetten skaliert linear.

**Gemessen am 23.09.2026 auf vps1**, der Zielmaschine (KVM, 8 vCPU, 16 GB),
im Live-Modus über die öffentliche Demo, von aussen im Browser. Die Zeiten der
Schritte zeigt die Anwendung selbst an; die Gesamtzeit zählt ab dem Absenden.

| Vorgang                                     | Zeit        |
| ------------------------------------------- | ----------- |
| Startseite laden (von aussen, mit TLS)      | 0,3 s       |
| Frage einbetten                             | 0,0 s       |
| Dokumente durchsuchen (Hybridsuche)         | 0,1 s       |
| Modell formuliert die Antwort               | 2,2 s       |
| Belege prüfen                               | 0,0 s       |
| Ganze Antwort, fünf Fragen, vom Absenden an | 2,3 – 4,1 s |

Die Wartezeit ist auch auf dem Server fast vollständig der Modellaufruf;
Einbetten, Suche und Belegprüfung fallen daneben nicht ins Gewicht. Nicht
gemessen ist das Einlesen grosser Dateien auf vps1 — der Demo-Korpus mit sechs
kurzen Dokumenten sagt darüber nichts.

Praktische Folge für die Auslegung: Ein PDF mit 100 Seiten ergibt je nach
Textdichte 200 bis 400 Abschnitte, also rund 10 bis 20 Sekunden Einbettung auf
dieser Maschine. Das ist Hintergrundarbeit und blockiert niemanden — solange
sie im Worker läuft und nicht an einer Web-Anfrage hängt.

## Speicher auf dem Server

Das Modell liegt **genau einmal** im Speicher, im Worker (`docs/ENTSCHEIDE.md`,
E4). Nachweis: Die Zeile `[embeddings] Modell geladen: …` erscheint beim Start
genau einmal. Steht sie zweimal oder in einem anderen Prozess, ist die
Trennung verletzt und der Bedarf verdoppelt sich.

Auf einem geteilten Server gehört zusätzlich ein Speicherlimit je Container.

## Sicherung und Wiederherstellung

Zwei Arten von Sicherungen liegen unter `/var/backups/evidarium`:

- **Vor jeder Migration** (`infra/deploy.sh`): die Datenbank als SQL,
  `evidarium-<Zeit>-vor-<Commit>.sql.gz`. Sie bleibt liegen, bis jemand von
  Hand aufräumt.
- **Jede Nacht um 03:15** (`infra/sichern.sh` über einen systemd-Timer):
  die Datenbank im eigenen Format von `pg_dump` und die hochgeladenen
  Dateien als Archiv, beide mit demselben Zeitstempel unter `nacht/`.
  Datenbank und Dateien gehören zusammen: Eine Datenbank ohne ihre Dateien
  hinterlässt Dokumente ohne Inhalt, Dateien ohne Datenbank verwaiste Bytes.
  Aufbewahrt werden 14 Tage; ältere nächtliche Sicherungen entfernt das
  Skript selbst.

Einrichten, einmal, als root:

```bash
sudo cp /opt/evidarium/infra/systemd/evidarium-sicherung.service /etc/systemd/system/
sudo cp /opt/evidarium/infra/systemd/evidarium-sicherung.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now evidarium-sicherung.timer
sudo systemctl start evidarium-sicherung.service
sudo systemctl list-timers evidarium-sicherung.timer
````

Der vorletzte Befehl macht die erste Sicherung sofort, der letzte zeigt den
nächsten Lauf.

**Zurückspielen proben, einmal im Monat.** Die laufende Datenbank bleibt
unberührt:

```bash
sudo /opt/evidarium/infra/sicherung-pruefen.sh
```

Das Skript lädt die neueste nächtliche Sicherung in eine vorübergehende
Datenbank, zählt Konten, Dokumente und Abschnitte, zählt die Dateien im
Archiv und entfernt die Probedatenbank wieder. Lokal geprobt am 22.09.2026
gegen die Testdatenbank, samt pgvector-Spalten.

**Im Ernstfall** (Zeitstempel einsetzen). Auf vps1 noch nie durchgespielt;
die monatliche Probe deckt den Datenbankteil ab:

```bash
cd /opt/evidarium
C="docker compose -f infra/compose.prod.yml --env-file infra/.env.production"
$C stop web worker
$C exec -T db dropdb -U evidarium_owner evidarium
$C exec -T db createdb -U evidarium_owner evidarium
$C exec -T db pg_restore -U evidarium_owner -d evidarium --exit-on-error < /var/backups/evidarium/nacht/db-<Zeit>.dump
$C run --rm --no-deps -T --entrypoint tar web -xzf - -C /app/storage < /var/backups/evidarium/nacht/dateien-<Zeit>.tar.gz
$C up -d
```

Das Archiv überschreibt gleichnamige Dateien und lässt übrige liegen.

**Vektoren lassen sich neu erzeugen**, falls sie verloren gehen: Der
Einlesevorgang läuft erneut. Das kostet Rechenzeit auf dem eigenen Server,
aber kein Geld, anders als Embeddings über eine Schnittstelle.

**Noch offen: eine Kopie ausser Haus.** Alle Sicherungen liegen auf vps1.
Fällt der Server aus, sind sie mit weg.

## Gesundheit

Web und Worker haben je einen Healthcheck in `infra/compose.prod.yml`:

- **Web:** `GET /api/gesundheit` antwortet `{"ok":true}`, wenn der Prozess
  läuft und die Datenbank antwortet, sonst 503. Öffentlich erreichbar,
  darum ohne Einzelheiten.
- **Worker:** `GET /gesundheit` auf dem internen Port 3101 antwortet erst,
  wenn das Modell geladen ist. Beim ersten Start lädt der Worker es herunter;
  die Anlaufzeit ist darum fünf Minuten.

`deploy.sh` wartet nach dem Start, bis beide gesund sind, und bricht sonst
mit den letzten Protokollzeilen ab. Den Zustand zeigt jederzeit:

```bash
docker compose -f /opt/evidarium/infra/compose.prod.yml --env-file /opt/evidarium/infra/.env.production ps
```

Docker startet einen ungesunden Container nicht von selbst neu; es startet
ihn neu, wenn er abstürzt (`restart: unless-stopped`). Der Healthcheck ist
der Nachweis nach dem Deployment und der erste Blick bei einer Störung.
