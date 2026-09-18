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

Caddy: `infra/caddy/evidarium.caddy` in die Konfiguration des gemeinsamen
Caddy aufnehmen. `flush_interval -1` ist noetig, sonst puffert der Proxy den
Antwortstrom und die Schrittanzeige kommt am Stueck.

**Fallstrick:** `docker compose --env-file` ueberschreibt nichts, was schon in
der Umgebung steht. Wer vorher `.env` eingelesen hat, faehrt still gegen die
falsche Datenbank. `deploy.sh` entfernt die betroffenen Variablen darum
selbst.

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

```

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

**Diese Zahlen stammen nicht von der Zielmaschine.** vps1 ist ein KVM-Server
mit anderer CPU und wird langsamer sein. Die Messung dort steht noch aus und
gehört vor den ersten echten Betrieb — eine Schätzung ersetzt sie nicht.

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

Noch nicht eingerichtet — kommt mit dem Deployment an Tag 5. Zu beachten:

- **Der Objektspeicher gehört nicht zum Datenbank-Backup.** Ein Rückspielen
  der Datenbank ohne die Dateien hinterlässt Dokumente ohne Inhalt, ein
  Rückspielen der Dateien ohne die Datenbank verwaiste Bytes. Beides gehört
  zusammen zurückgespielt.
- **Vektoren lassen sich neu erzeugen**, wenn sie verloren gehen: Der
  Einlesevorgang läuft erneut. Das kostet Rechenzeit auf dem eigenen Server,
  aber kein Geld — anders als bei Embeddings über eine Schnittstelle.
- Die Datenbank vor jeder Migration sichern, das Zurückspielen regelmässig
  proben.
```
