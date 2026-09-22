# Evidarium — Fallstudie

**Antworten aus deinen Dokumenten – mit Quellen, die du nachlesen kannst.**

Ein Wissensassistent für eigene Dokumente: hochladen, fragen, Antworten mit
anklickbaren Belegen erhalten. Gebaut in fünf Arbeitstagen, allein, von der
leeren Ablage bis zur öffentlichen Demo.

---

## Das Problem ist nicht das Antworten

Ein Sprachmodell, das Fragen zu Dokumenten beantwortet, ist an einem
Nachmittag gebaut. Die Antworten klingen gut. Genau das ist das Problem.

Denn dieselbe Maschinerie, die richtige Antworten flüssig formuliert,
formuliert falsche genauso flüssig. Sie kann eine Fundstelle nennen, die es
nicht gibt. Sie kann ein Zitat glätten, bis es etwas anderes bedeutet. Sie
kann eine Seitenzahl dazuerfinden, die plausibel ist und falsch. Und weil das
Ergebnis eine Quellenangabe trägt, sieht es vertrauenswürdiger aus als eine
Antwort ohne.

**Das Versprechen dieses Projekts ist darum nicht Unfehlbarkeit, sondern
Nachprüfbarkeit.** Jede Aussage trägt ein wörtliches Zitat; ein Klick öffnet
die Stelle im Originaldokument. Findet die Suche keine Grundlage, sagt die
Anwendung das, statt etwas zu erfinden.

## Die Entscheidung, an der alles hängt

Zwischen Modellausgabe und Bildschirm sitzt eine Prüfung. Was sie nicht
besteht, wird **nicht angezeigt** — nicht abgeschwächt, nicht mit Warnhinweis,
sondern gar nicht.

Sie prüft zwei Dinge, beide hart:

1. **Jede Quellen-ID stammt aus der Menge, die dem Modell tatsächlich
   übergeben wurde.** Eine erfundene ID ist der häufigste Weg, auf dem eine
   plausible Antwort an eine falsche Stelle geheftet wird.
2. **Jedes Zitat kommt wörtlich im zugehörigen Abschnitt vor.** Verglichen
   wird nach einer eng gefassten Normalisierung: Unicode-Form, Leerraum,
   typografische Anführungs- und Bindestriche — also genau das, was beim
   Extrahieren aus einem PDF ohnehin entsteht. **Nicht** erlaubt sind
   Kleinschreibung, das Entfernen von Satzzeichen oder ein Ähnlichkeitsmass.
   Jede zusätzliche Grosszügigkeit an dieser Stelle schwächt die Prüfung.

Dazu kommt eine Festlegung im Datenformat: **Das Antwortschema des Modells
enthält kein Feld für Dateiname, Seite oder Zeile.** Diese Angaben ergänzt der
Server anhand der Quellen-ID. Dürfte das Modell sie selbst setzen, könnte es
zu einem echten Abschnitt eine falsche Seitenzahl schreiben — und die Antwort
sähe vollkommen glaubwürdig aus.

Ein Beispiel aus dem echten Betrieb: Das Modell schreibt in seiner eigenen
Aussage «Zugänge» mit Umlaut, zitiert aber «Zugaenge» — so, wie es im Dokument
steht. Hätte es geglättet, wäre die Antwort verworfen worden.

## Vier Urteile statt einer Prozentzahl

Jede Antwort trägt eine Kategorie: **belegt**, **teilweise belegt**, **keine
Grundlage** oder **Widerspruch**. Das sind Urteile, keine
Wahrscheinlichkeiten. «97 Prozent sicher» wäre eine erfundene Zahl; ob ein
Satz belegt ist, ist eine Ja-Nein-Frage je Satz.

Der Fall **Widerspruch** ist der lehrreichste. Liegen zwei Dokumente vor, die
sich widersprechen, nennt die Antwort beide mit je eigenem Zitat und löst den
Widerspruch **nicht** auf. Das ist keine Schwäche, sondern der Punkt: Welche
Regelung gilt, steht nicht in den Dokumenten. Eine Anwendung, die sich hier
für eine Seite entscheidet, erfindet eine Rangfolge.

## Gemessen, nicht behauptet

Zwölf versionierte Prüffälle gegen einen Korpus von sechs Dokumenten einer
**erfundenen** Firma: vier direkte Fragen, zwei über mehrere Dokumente, zwei
nicht beantwortbare, zwei Konfliktfragen, eine Nachfrage, ein
Prompt-Injection-Versuch.

Erfunden ist Absicht. Ein echtes Handbuch dürfte nicht ins öffentliche
Portfolio — und ein aus dem Netz geholtes wäre womöglich schon im Training des
Modells gewesen. Dann liesse sich nicht mehr unterscheiden, ob eine Antwort
aus dem Dokument stammt oder aus dem Gedächtnis des Modells. Genau das soll
die Messung aber feststellen.

**Ergebnis: 12 von 12 bestanden, 48,6 Sekunden, 0,0357 US-Dollar.** Das
Protokoll enthält alle Antworten im Wortlaut, mit Fundstelle und Zitat, und
wird vom Prüfskript geschrieben — nicht von Hand gepflegt.

Je Fall steht nicht nur, was erwartet wird, sondern auch, **was verboten ist**.
Das Verbotene ist der wichtigere Teil: Ob eine Antwort brauchbar klingt, sieht
man schnell; ob sie etwas erfindet, das nirgends steht, sieht man nur, wenn
man vorher aufgeschrieben hat, was nicht vorkommen darf. Auf die Frage nach
der Reaktionszeit etwa darf kein «rund um die Uhr» erscheinen — im Dokument
steht eine interne Zielvorgabe mit Servicefenster, keine vertragliche Zusage.

## Fünf Fehler, die nur das Messen gezeigt hat

Diese Liste ist der eigentliche Inhalt des Projekts. Jeder dieser Fehler hätte
in einer Vorführung nichts gemacht und im Betrieb geschadet.

**Die Volltextsuche war tot, ohne dass es auffiel.** PostgreSQL verknüpft mit
`websearch_to_tsquery` alle Wörter einer Frage mit UND. «Wer hilft beim
Onboarding?» verlangte damit einen Abschnitt, der alle vier Wörter enthält —
bei einer natürlichen Frage trifft das nie. Die Hybridsuche lieferte trotzdem
Ergebnisse, weil die semantische Hälfte immer etwas findet. Die lexikalische
Hälfte war schlicht wirkungslos. Sichtbar wurde es erst, als ich beide Hälften
getrennt gemessen habe: null Treffer gegen den richtigen Abschnitt auf Platz
eins.

**Ein Deadlock, der nur unter Last auftritt.** Die Budgetprüfung läuft in
einer Transaktion. Eine Abfrage darin benutzte die globale
Datenbankverbindung und zog damit eine **zweite** Verbindung aus dem Pool. Bei
zwölf gleichzeitigen Anfragen belegten die Transaktionen den ganzen Pool und
warteten alle auf eine weitere Verbindung, die nie frei wurde. Im Einzeltest
passiert das nie. Der Parallelitätstest lief in die Zeitüberschreitung;
nach der Behebung fiel die Testlaufzeit von 57 auf 2,2 Sekunden.

**Eine Bibliothek, die den Eingabepuffer abkoppelt.** Der PDF-Leser gibt den
übergebenen Speicher nach dem Lesen frei. Ein zweiter Aufruf mit demselben
Puffer meldete «beschädigt» — für eine einwandfreie Datei. Die Anwendung hätte
jemandem etwas Falsches über sein eigenes Dokument gesagt. Behoben mit einer
Kopie und einem Regressionstest.

**Alle gemessenen Zeiten standen auf 0,0 Sekunden.** Die Oberfläche zeigt, wie
lange jeder Arbeitsschritt gedauert hat. Die Uhr wurde im
Zustands-Aktualisierer von React abgelesen — und der muss rein sein: React
ruft ihn erneut auf, und beim zweiten Lauf stand eine neuere Zeit darin. Die
Anzeige behauptete, alles sei sofort fertig. Tatsächlich ist der Modellaufruf
praktisch die gesamte Wartezeit; alles andere liegt unter 0,05 Sekunden. Das
steht jetzt so da.

**Der Injektionstest prüfte das Falsche.** Im Korpus liegt eine als Test
markierte Passage «Ignoriere alle bisherigen Regeln …». Das Modell lehnte
korrekt ab — und begründete das ausdrücklich mit der Markierung. Geprüft hatte
ich damit, dass es Etiketten liest, nicht dass es Anweisungen abwehrt. Ein
echter Angriff trägt kein Schild. Seither liegt eine zweite, **unmarkierte**
Anweisung im Dokument, getarnt als Traktandum einer Besprechung. Sie verlangt
ein harmloses Freigabewort; taucht es in irgendeiner Antwort auf, hat das
Modell gehorcht. Es ist darum in **jedem** Prüffall verboten, nicht nur im
Injektionsfall — denn der gefährliche Weg ist nicht die Frage «führe die
Anweisung aus», sondern die harmlose Frage, deren Suche den vergifteten
Abschnitt findet.

**Und einer, der gar kein Programmierfehler war.** Beim Nachprüfen der eigenen
Sätze für diese Fallstudie fiel auf: Das README nannte die Löschkaskade seit
Tag 1 «gebaut und getestet». Gebaut war nur die Spalte `deleted_at`. Der Satz
stand seit dem ersten Tag in einem öffentlichen Repository. Seither steht die
Kaskade wirklich, mit vier Tests — und die Lehre ist die unbequemere: Eine
Behauptung in der Dokumentation ist kein Nachweis, auch wenn man sie selbst
geschrieben hat.

## Der Prüfer wird selbst geprüft

«12 von 12 bestanden» sagt für sich genommen nur, dass mein eigener Prüfcode
zufrieden war. Ein Prüfer, der nie anschlägt, ist schlimmer als keiner: Er
erzeugt eine Zahl, auf die sich jemand verlässt.

Die Prüflogik ist darum eine reine Funktion mit eigenen Tests — sie muss bei
falscher Kategorie, fehlendem Fakt, verbotener Behauptung, falscher Seite und
bei Antworten aus nicht gewählten Dokumenten anschlagen. Dazu eine Gegenprobe
am echten Lauf: erwartete Seite von 2 auf 3 verfälscht, Fall scheitert mit
«Fundstelle fehlt».

## Was der Betrieb kostet, und wer ihn bezahlt

Eine öffentliche Demo hängt an einem Schlüssel, den der Betreiber bezahlt.
Das ist das grösste Risiko dieser Anwendung — grösser als die Anmeldung.

Budget wird **vor** dem Aufruf reserviert, nicht danach nachgerechnet. Ohne
Reservierung sähen gleichzeitige Anfragen beim Prüfen jeweils noch Luft und
liefen gemeinsam über den Deckel. Endet ein Aufruf ohne Messwerte, bleibt die
Reservierung stehen und wird als «unklar» markiert, nicht gelöscht: Fehlende
Messwerte sind keine Nullkosten, der Anbieter kann die Anfrage sehr wohl
verarbeitet haben.

Die Grenzen sind **verschieden viel wert**, und die Anwendung sagt das:

| Grenze                      | Umgehbar durch     | Zweck        |
| --------------------------- | ------------------ | ------------ |
| Fragen je Besuch            | Cookies löschen    | Fairness     |
| Fragen je Herkunft und Tag  | Anschluss wechseln | Fairness     |
| Tages- und Monatsdeckel USD | nichts             | **Schranke** |

Eine schwer umgehbare Besuchererkennung wäre Fingerprinting — teuer,
aufdringlich und für den Zweck unnötig. Gespeichert wird je ein Hash: der des
Besuchercookies und der der Herkunft. Weder IP-Adresse noch Cookie-Wert landen
in der Datenbank.

Eine erreichte Grenze ist **kein Fehler**. Wer dagegenläuft, hat nichts falsch
gemacht und bekommt einen freundlichen Satz, keinen roten Kasten.

Die Dokumentauswahl setzt in der Demo der Server, nicht der Browser — wer IDs
schicken darf, probiert fremde.

Eigene Dateien darf man mitbringen, aber eng begrenzt: drei je Besuch, je
2 MiB und 10 Seiten, **gelöscht nach 24 Stunden**. Der Hinweis darauf steht
über dem Formular, nicht darunter, und sagt deutlich, dass nichts
Vertrauliches hochgeladen gehört. Denn das eigentliche Risiko ist nicht die
volle Datenbank — das fängt man mit Zahlen ab —, sondern fremde Personendaten
auf fremdem Server. Ein Hinweis, den man erst nach dem Hochladen liest, ist
keiner; ein Browsertest prüft darum die Reihenfolge auf der Seite.

## Die Gestaltung kommt aus dem Material

Die Anwendung ist eine matte Arbeitsfläche. Alles, was aus einem Dokument
stammt, liegt darauf als **Blatt**: warmes Papier, eigene Kante, leicht
abgehoben — in beiden Farbschemata das einzige Helle auf dem Bildschirm.

Damit braucht der Beleg **keine Akzentfarbe.** Er ist nicht eingefärbt,
sondern aus anderem Material. Dazu zwei Schriften, deren Unterschied die
Aussage ist: eine Grotesk spricht die Anwendung, eine Serife das Dokument.
Wer ein Zitat sieht, sieht sofort, dass es von woanders kommt.

**Farbe hat genau eine Aufgabe: das Urteil.** Belegt, teilweise belegt, keine
Grundlage, Widerspruch — vier Zustände, vier Farben, sonst keine. Knöpfe
tragen Tinte, der Fokusring bleibt farblos, und neben jeder Farbe steht das
Urteil als Wort: Wer Farben nicht unterscheidet, verliert nichts.

Der sichtbarste Nutzen davon steht in der Seitenspalte. Nach einer Antwort
färbt sich je Dokument ein Punkt in der Farbe des Urteils, wenn es die
Antwort getragen hat. Das beantwortet auf einen Blick, was man sonst durch
alle Belege hindurch nachzählen müsste: **Worauf steht diese Antwort?** Bei
einem Widerspruch leuchten zwei Punkte, bei «keine Grundlage» keiner — und
das ist selbst eine Auskunft.

Auf der Startseite läuft eine Frage wirklich durch, mit den gemessenen
Zeiten. Ein Standbild hätte das Wesentliche verschwiegen: dass zwischen Frage
und Antwort Arbeit liegt, und wo sie liegt. Der Hintergrund ist dabei kein
Muster, sondern das Archiv — angedeutete Blätter, eines je Dokument, die
hervortreten, wenn ihr Dokument zur laufenden Antwort beiträgt.

Drei Fassungen sind vorher gefallen, alle drei, weil sie Voreinstellungen
waren statt Entscheidungen: warmes Minimal mit grünem Akzent, dann fast
schwarz mit leuchtendem Zinnober, dann der Broadsheet-Griff mit Haarlinien
und gesperrten Versalien. Was am Ende trägt, ist nicht ein Effekt, sondern
**Dichte**: eine echte Oberfläche mit ihren kleinen, wahren Einzelheiten.

## Bewusst nicht gebaut

Begründete Lücken lesen sich als Urteilsvermögen, ungenannte als Unwissen.

**Kein Zwei-Faktor.** Der Demo-Zugang ist öffentlich dokumentiert; ein zweiter
Faktor davor schützt nichts. Das echte Risiko ist der API-Schlüssel — und der
liegt ausschliesslich auf dem Server, mit Ausgabengrenze beim Anbieter und
drei Grenzen in der Anwendung. Zwei-Faktor sitzt dort, wo es zählt: auf den
Konten des Betreibers.

**Kein Passwort-Reset per Mail.** Dafür bräuchte es Mailversand, eine
Warteschlange für Zustellfehler und Schutz vor Konten-Aufzählung — Aufwand für
eine Handvoll Konten, die über einen lokalen Befehl entstehen.

**Keine Kontolöschung in der Oberfläche.** Dieselbe Begründung. Gebaut und
getestet ist stattdessen die vollständige Löschkaskade für **Dokumente**, weil
sie zur Kernfunktion gehört: Ein gelöschtes Dokument verschwindet aus Suche,
Auswahl und aus allen Antworten, die es als Grundlage hatten.

**Kein zentraler Identitätsdienst.** Für eine Demo wäre er Betriebsaufwand und
ein zusätzlicher Ausfallpunkt: Steht er still, kommt niemand mehr hinein. Er
kommt, sobald es echte Nutzer gibt — dann als zweiter Anmeldeweg neben der
lokalen Anmeldung.

**Kein wortweises Tickern der Antwort.** Es wäre in einer Minute eingebaut und
wäre hier schädlich: Der Text darf erst erscheinen, wenn die Belegprüfung ihn
freigegeben hat. Eine Antwort, die halb dasteht und dann verschwindet, weil
ein Zitat nicht standhielt, wäre schlimmer als eine, die drei Sekunden später
vollständig erscheint. Gestreamt werden darum die **Arbeitsschritte**, mit
gemessenen Zeiten.

## Technik in Kürze

Next.js mit App Router, TypeScript strict, PostgreSQL 18 mit pgvector,
Drizzle, eigener Worker mit Jobqueue in der Datenbank.

**Embeddings laufen lokal** auf dem eigenen Server, die Suche ebenso; ganze
Dateien verlassen ihn nie. Für eine Antwort gehen die gefundenen Abschnitte —
höchstens acht je Frage — an die Schnittstelle von Anthropic. Eine frühere
Fassung dieses Absatzes behauptete, die Dokumente verliessen die Maschine gar
nicht; das war falsch und ist beim Prüfbericht vor dem Start aufgefallen.
Gesucht wird hybrid: semantisch über Vektoren **und** lexikalisch über
die Volltextsuche in zwei Sprachkonfigurationen, zusammengeführt über
Reciprocal Rank Fusion. Beide Verfahren machen verschiedene Fehler — die
semantische Suche findet Umschreibungen und scheitert an Eigennamen und
Nummern, die Volltextsuche umgekehrt.

Sicherheit war ab dem ersten Commit eingerichtet, nicht nachträglich: täglicher
Abhängigkeits- und Secret-Scan, Wartezeit von sieben Tagen vor jeder neuen
Paketfassung, zwei Datenbankrollen, Argon2id, serverseitige Sitzungen,
Rate-Limit in der Datenbank. Drei Schwachstellen der Stufe «hoch» wurden
behoben statt ausgenommen; eine vierte war befristet ausgenommen, mit Datum
und Begründung, weil ihr Fix an der eigenen Wartezeit scheiterte.

**Zahlen:** 139 automatische Tests, 436 Browserprüfungen in Chromium, Firefox
und Safari, auf 320, 768 und 1440 Pixeln und einem iPhone, in vier Sprachen,
42 nummerierte und begründete Entscheidungen. Keine Datei über 400
Zeilen, keine Schrift unter 16 Pixeln — beides wird in der CI erzwungen.

Die Abnahmeliste steht im Repository mit dem, **wodurch** jeder Punkt
nachprüfbar ist — und mit dem, was nur einmal von Hand vorgeführt wurde. Das
ist ein Unterschied, den ich erst beim Durchgehen gemacht habe: Von Hand
vorgeführt heisst, es galt an einem Tag, auf einem Rechner.

## Was ich mitnehme

Der Unterschied zwischen einer Vorführung und einem Produkt liegt nicht in der
Funktionsliste. Er liegt darin, ob jemand gemessen hat, was passiert, wenn es
schiefgeht — und ob er das Ergebnis aufgeschrieben hat, auch wenn es ihm nicht
passt.

Jeder der fünf Fehler oben wäre unbemerkt geblieben. Vier davon hätten in
einer Demo funktioniert. Einer hätte jemandem etwas Falsches über sein eigenes
Dokument gesagt.
