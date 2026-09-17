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

Stand Tag 1 — Dokumente, Abschnitte und Läufe kommen an den Tagen 2 bis 4.

| Tabelle          | Inhalt                                 |
| ---------------- | -------------------------------------- |
| `users`          | Konto, Argon2id-Hash, Status           |
| `sessions`       | Serverseitige Sitzung, Ablauf          |
| `login_attempts` | Fehlversuche je Herkunft, nur als Hash |
