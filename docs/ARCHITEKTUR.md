# Architektur

## Zwei Wege

**Einlesen** läuft einmal je Dokument, im Hintergrund:

```
Upload → Job → Text mit Seitenzahlen → Abschnitte → Embeddings → aktiv
```

Der Upload-Endpunkt nimmt die Datei an, legt einen Job an und antwortet. Er
wartet nie auf die Verarbeitung.

**Antworten** läuft bei jeder Frage:

```
Frage → Vektor → pgvector + Volltext → Fusion → Kontext → Modell
      → Belegprüfung → Anzeige
```

Die Belegprüfung ist die Stelle, an der alles hängt: Jedes Zitat muss nach
Whitespace-Normalisierung wörtlich im zugehörigen Abschnitt vorkommen, und
jede Quellen-ID muss aus der Menge stammen, die tatsächlich übermittelt wurde.
Was diese Prüfung nicht besteht, wird nicht angezeigt.

Dateiname, Seite und Dokument-ID ergänzt der Server aus der Quellen-ID. Das
Modell bestimmt keine Metadaten.

## Prozesse

| Prozess       | Aufgabe                                         | Hält das Embedding-Modell |
| ------------- | ----------------------------------------------- | ------------------------- |
| Web (Next.js) | Oberfläche, Server Actions, Antwortlauf         | nein                      |
| Worker (Node) | Extraktion, Chunking, Embeddings, Löschjobs     | **ja, einzige Kopie**     |
| PostgreSQL 18 | Daten, Vektoren, Volltext, Jobqueue, Rate-Limit | —                         |

Siehe `docs/ENTSCHEIDE.md`, E4.

## Datenmodell

Stand Tag 2. Läufe, Belege und Kosten kommen an Tag 4.

| Tabelle             | Inhalt                                                           |
| ------------------- | ---------------------------------------------------------------- |
| `users`             | Konto, Argon2id-Hash, Status                                     |
| `sessions`          | Serverseitige Sitzung, Ablauf                                    |
| `login_attempts`    | Fehlversuche je Herkunft, nur als Hash                           |
| `documents`         | Datei, Typ, Grösse, Inhaltshash, Speicherpfad, aktive Version    |
| `document_versions` | Parser- und Chunker-Version, Status, Fehlercode, Seiten, Zeichen |
| `document_chunks`   | Abschnitt mit **Seite** oder **Zeilenbereich**, Text, Nummer     |
| `pgboss.*`          | Von pg-boss selbst verwaltet, siehe E11                          |

**Die Herkunft eines Abschnitts ist der Kern des Datenmodells.** Bei PDF steht
die Seite darin, bei Text und Markdown der Zeilenbereich — das eine oder das
andere, nie beides und nie geraten. Fehlt die Angabe, kann später kein Beleg
darauf zeigen, und das Produktversprechen fällt in sich zusammen.

Eindeutig ist ein Abschnitt über Version und Nummer. Damit erzeugt ein
wiederholter Job keine Dubletten, auch wenn er mitten im Schreiben abbricht.

## Dateien

Hochgeladene Dateien liegen auf einem lokalen Volume unter
`STORAGE_PATH/<nutzer>/<dokument>`. **Der Pfad entsteht serverseitig aus IDs,
nie aus dem Dateinamen** — ein Name aus dem Browser darf nirgends in einen Pfad
geraten. Zusätzlich prüft `speicher.ts`, dass das Ziel unterhalb der Wurzel
bleibt.
