# Prüfbericht vor dem Start

_21.09.2026._ Vollständige Prüfung vor dem ersten Deployment: Barrierefreiheit,
Sicherheit, Datenschutz, Gestaltung, Betrieb. Anlass war Adams Vorgabe, nichts
Halbfertiges online zu stellen.

**Jeder Befund hat einen Beleg.** Wo etwas «geprüft» heisst, steht dabei, wie.

## Vorgehen

| Bereich                | Wie geprüft                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| Barrierefreiheit, auto | `@axe-core/playwright` gegen WCAG 2.2 AA, `/`, `/login`, `/demo`, hell und dunkel getrennt |
| Barrierefreiheit, Hand | Überschriftengliederung, Landmarken, Fokusring gemessen, Bewegung nach 2.2.2, Ansagen      |
| Kontraste Bedienung    | WCAG 1.4.11 gerechnet — axe prüft das nicht                                                |
| Sicherheit             | HTTP-Köpfe, Anmeldeablauf, Upload- und Demo-Endpunkte im Code, Grenzen gegen Missbrauch    |
| Datenschutz            | Was wohin geht, was wie lange liegt, was behauptet wird                                    |
| Gestaltung             | Alle Seiten auf 1440, hell und dunkel; `avoid-ai-design` im Erkennungsmodus                |
| Dritte, Gewicht        | Netzwerkanfragen der Startseite: **null** an fremde Domains                                |

**axe ergab null Verstösse.** Das ist notwendig, aber nicht hinreichend: Ein
Automat findet etwa ein Drittel dessen, was WCAG verlangt. Alle Befunde unten
stammen aus den Handprüfungen.

## Muss vor dem Start behoben sein

| Nr. | Bereich          | Befund                                                                                                                                              | Beleg                                                                                    |
| --- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| B1  | Datenschutz      | README, Fallstudie und E3 behaupten «Dokumente verlassen den Server nicht». **Falsch:** Je Frage gehen bis zu acht Abschnitte an Anthropic.         | `README.md:42`, `docs/FALLSTUDIE.md:272`, `docs/ENTSCHEIDE.md:19`, `KONTEXT_STELLEN = 8` |
| B2  | Recht            | Kein Impressum, keine Datenschutzerklärung. Die Demo nimmt Dateien an, setzt ein Cookie, speichert einen IP-Hash und schickt Abschnitte in die USA. | `src/app/` hat keine Rechtsseiten                                                        |
| B3  | WCAG 2.2.2 (A)   | Die Vorführung läuft endlos, das Archiv schwebt endlos — **keine Pause-Steuerung**. `prefers-reduced-motion` ist dafür keine anerkannte Technik.    | `vorfuehrung.tsx`, `vorfuehrung.css`; steht schon in `wissen-recht-web-schweiz`          |
| B4  | WCAG 2.4.7 (AA)  | Fokusring auf dem Hauptknopf im Dunkeln **unsichtbar**: `outline: currentColor` = Schriftfarbe des Knopfs = Seitengrund.                            | gemessen: Umriss `rgb(35,33,30)`, Seitengrund `rgb(35,33,30)`                            |
| B5  | WCAG 1.4.11 (AA) | Eingabefelder heben sich kaum ab: Rand 1,22:1 (dunkel), 1,53:1 (hell). Verlangt sind 3:1.                                                           | gerechnet, siehe unten                                                                   |
| B6  | Sicherheit       | Keine Content Security Policy.                                                                                                                      | `curl -I /`: kein `Content-Security-Policy`                                              |
| B7  | Missbrauch       | Demo-Uploads sind je Besuch begrenzt, aber **nicht je Herkunft**: Cookie löschen, drei neue Dateien, beliebig oft. Füllt Platte und Rechenzeit.     | `src/app/api/demo/documents/route.ts`: kein Herkunftszähler                              |
| B8  | Gestaltung       | 404 und Fehlerseite sind Next-Standard: englisch, schwarz, fremde Schrift.                                                                          | `curl /gibt-es-nicht` → «404: This page could not be found.»                             |

## Sollte vor dem Start behoben sein

| Nr. | Bereich          | Befund                                                                                                      |
| --- | ---------------- | ----------------------------------------------------------------------------------------------------------- |
| S1  | WCAG 4.1.3 (AA)  | Die fertige Antwort wird Screenreadern **nicht angesagt**. Die Schritte schon, das Ergebnis nicht.          |
| S2  | Gliederung       | Antworten tragen `h3`, ohne `h2` darüber.                                                                   |
| S3  | Bedienung        | Keine Sprungmarke zum Inhalt; keine Fusszeile auf irgendeiner Seite.                                        |
| S4  | WCAG 1.4.11 (AA) | Hell: Belegblatt gegen Fläche 1,46:1 — das Blatt ist ein Knopf, seine Kante muss erkennbar sein.            |
| S5  | Sicherheit       | Anmeldung verrät über die Laufzeit, ob ein Konto existiert: Ohne Konto wird kein Argon2 gerechnet.          |
| S6  | Sicherheit       | Anfragegrösse unbegrenzt: `request.formData()` und `request.json()` lesen alles, bevor geprüft wird.        |
| S7  | Datenschutz      | Der IP-Hash bleibt in `usage_events` für immer liegen. Eigene Regel in `wissen-sicherheit`: kurz speichern. |
| S8  | Auftritt         | Kein Favicon, keine Open-Graph-Angaben — ein geteilter Link zeigt nichts.                                   |
| S9  | Wie Tallyroom    | Keine Barrierefreiheitserklärung, kein `security.txt`.                                                      |
| S10 | Gestaltung       | Kopfzeilen uneinheitlich: Anmeldeseite ohne Kopf, Start, Demo und Anwendung je anders.                      |

## Nach dem Start

| Nr. | Befund                                                                                   |
| --- | ---------------------------------------------------------------------------------------- |
| N1  | `sessions` und `login_attempts` werden nie aufgeräumt.                                   |
| N2  | Keine nächtliche Sicherung — nur vor jeder Migration.                                    |
| N3  | Kein Gesundheitsendpunkt, keine Healthchecks für Web und Worker in `compose.prod.yml`.   |
| N4  | Antwort- und Retrievalzeit auf vps1 ungemessen; die Zahlen in `BETRIEB.md` sind vom Mac. |

## Kontraste im Einzelnen

WCAG 1.4.11 verlangt 3:1 für alles, woran man ein Bedienelement erkennt.

| Paar                            | Dunkel | Hell   | Soll  |
| ------------------------------- | ------ | ------ | ----- |
| Rand Eingabefeld gegen Panel    | 1,22:1 | 1,53:1 | 3:1   |
| Füllung Eingabefeld gegen Panel | 1,19:1 | 1,25:1 | 3:1   |
| Belegblatt gegen Fläche         | 14,4:1 | 1,46:1 | 3:1   |
| Fliesstext leise auf Panel      | 5,93:1 | 5,62:1 | 4,5:1 |
| Zitat-Umgebung auf Markierung   | 4,85:1 | 5,48:1 | 4,5:1 |

Fliesstext besteht überall. Die Bedienelemente nicht.

## Stand der Behebung

_21.09.2026, am selben Tag._ Jeder Befund ist behoben **und durch einen Test
festgehalten**, damit er beim nächsten Umbau nicht still zurückkommt.

| Nr. | Behoben durch                                                                                                                                                                       | Festgehalten in                       |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| B1  | README, Fallstudie und E3 berichtigt (E3 berichtigt, nicht gelöscht)                                                                                                                | —                                     |
| B2  | Impressum, Datenschutz; Angaben nur auf dem Server, `deploy.sh` bricht ohne sie ab. Formulierungen zu Hosting, Protokollen und iCloud aus dem bereits abgenommenen Text der Website | `e2e/a11y.spec.ts`, `e2e/csp.spec.ts` |
| B3  | Knopf «Anhalten» in der Fensterleiste, hält Vorführung und Archiv an                                                                                                                | `e2e/fokus.spec.ts`                   |
| B4  | Fokusring in der Tinte der Fläche statt `currentColor`                                                                                                                              | `e2e/fokus.spec.ts`, hell und dunkel  |
| B5  | Eigener Token `--rand-bedienung`, 3,25:1 bis 4,02:1                                                                                                                                 | `tests/kontrast.test.ts`              |
| B6  | CSP mit Nonce, ohne `unsafe-inline` bei Skripten                                                                                                                                    | `e2e/csp.spec.ts` samt Gegenprobe     |
| B7  | Grenze je Herkunft (10 am Tag) und gesamt (300 Dateien)                                                                                                                             | Code; Tests der Zähler in `tests/`    |
| B8  | Eigene 404-, Fehler- und Rückfallseite auf Deutsch                                                                                                                                  | `e2e/a11y.spec.ts`, `e2e/csp.spec.ts` |
| S1  | Fertige Antwort wird über `role="status"` angesagt                                                                                                                                  | —                                     |
| S2  | `h2` für Seitenspalte und Unterhaltung                                                                                                                                              | —                                     |
| S3  | Sprungmarke und Fusszeile auf jeder Seite                                                                                                                                           | `e2e/fokus.spec.ts`                   |
| S4  | Blattkante hell dunkler: 3,23:1                                                                                                                                                     | `tests/kontrast.test.ts`              |
| S5  | Immer eine volle Argon2-Prüfung, auch ohne Konto                                                                                                                                    | `src/lib/auth/password.test.ts`       |
| S6  | Grösse vor dem Lesen geprüft; `request_body` im Caddy-Auszug                                                                                                                        | —                                     |
| S7  | IP-Hash nach 24 Stunden entfernt, Kostenprotokoll bleibt                                                                                                                            | `tests/demo.test.ts`                  |
| S8  | Favicon, Vorschaubild mit den eigenen Schriften, Open-Graph-Angaben                                                                                                                 | —                                     |
| S9  | Barrierefreiheitserklärung, `security.txt` nach RFC 9116                                                                                                                            | `e2e/a11y.spec.ts`                    |
| S10 | Eine Kopfzeile für alle Seiten                                                                                                                                                      | —                                     |
| N1  | Anmeldeversuche und abgelaufene Sitzungen im geplanten Auftrag                                                                                                                      | —                                     |

**Offen bleiben N2 bis N4** (nächtliche Sicherung, Gesundheitsendpunkt,
Messung auf vps1) — sie gehören zum Betrieb und kommen mit dem Deployment.

**Zwei Dinge, die ich beim Beheben gelernt habe:**

- Die erste Gegenprobe zur CSP schlug fehl, und zwar zu Recht: Ein per
  `createElement` angelegtes Skript lief. Nicht wegen einer Lücke, sondern
  weil `page.evaluate` Sonderrechte hat und `'strict-dynamic'` Skripten
  vertraut, die ein vertrautes Skript selbst anlegt. Geprüft wird jetzt der
  echte Angriffsweg: eingeschleustes HTML mit Ereignis-Handler.
- Das Vorschaubild sah beim ersten Mal fast richtig aus — in Times und
  Helvetica. Eine Seite aus `setContent` darf keine `file://`-Schriften laden,
  und der Browser fiel still zurück. Das Skript prüft jetzt, ob die Schriften
  wirklich geladen sind, statt es anzunehmen.

## Was gut ist und bleibt

- axe: null Verstösse auf allen öffentlichen Seiten, hell und dunkel
- Null Anfragen an fremde Domains; Schriften selbst gehostet
- Bedienbar ab 320 px, keine Schrift unter 16 px, beides in der CI erzwungen
- Herkunftsprüfung, Sitzung serverseitig, Argon2id, Rate-Limit; ein defekter Hash (Demo-Konto) gibt sauber «falsch» zurück statt eines Fehlers
- Budget mit Reservierung, drei Deckel, Parallelitätstest
- Belegprüfung, Evaluation, Injektionstests

## Nachtrag 22.09.2026 — drei Engines, angemeldeter Bereich

Die Browsertests laufen jetzt auch in Firefox, in Safari (WebKit) und auf
einem iPhone, dazu erstmals im angemeldeten Bereich (Fragen, Dokumente,
Verbrauch). Drei Befunde, alle behoben und durch Tests festgehalten:

| Befund                                                                                                                                                                                        | Behoben durch                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Safari lud den Produktionsbuild auf `http://localhost` ohne CSS und Skripte: `upgrade-insecure-requests` schreibt dort auch localhost um                                                      | Direktive nur bei `https`-Herkunft (E37)                                            |
| Das Hintergrundlicht bewegte sich trotz «Bewegung reduzieren»: Die Regel dafür war weniger spezifisch als die Animationsregel                                                                 | spezifischerer Selektor, Test «Vorführung lässt sich anhalten» prüft auch das Licht |
| «Bewegung reduzieren» gab mit `transition-duration: 0.01ms` jedem Element einen Übergang auf jede Eigenschaft; nach einem Wechsel des Farbschemas stand kurz dunkle Schrift auf dunklem Grund | `0s` statt `0.01ms`, axe-Prüfung mit Antwort in beiden Schemata, wiederholt         |

Zwei Befunde lagen in der Testumgebung selbst, nicht in der Anwendung: Der
Prüfserver lief auf Port 3200 mit `APP_ORIGIN` auf 3100 — die Herkunftsprüfung
lehnte Fragen darum ab, und zwei Zugriffstests bestanden nur deshalb, weil
sie 3100 fest eingetragen hatten. Beides zieht die Adresse jetzt aus dem
Prüfserver.
