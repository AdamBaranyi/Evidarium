# Screenreader: automatisch und von Hand

## Automatisch (E44)

Bei jedem Push auf `main` läuft `.github/workflows/screenreader.yml`: VoiceOver
auf einem Mac der GitHub-Pipeline, gesteuert von Guidepup, mit Safari
(WebKit). Die Tests stehen in `screenreader/voiceover.spec.ts` und prüfen,
was VoiceOver tatsächlich sagt:

- Die Hauptüberschrift der Startseite wird als Überschrift der Stufe 1 gelesen.
- In der Demo wird die fertige Antwort angesagt («Antwort da: …»), und das
  Urteil ist als Überschrift mit Wort zu finden, nicht nur als Farbe.
- Im Rundgang wird jeder neue Schritt vorgelesen.

Lokal laufen sie nicht: VoiceOver fernzusteuern verlangt Eingriffe in die
Systemeinstellungen (`bun run test:screenreader` nur auf einem dafür
eingerichteten Mac).

## Von Hand, etwa 20 Minuten

Die Automatik belegt, **was** angesagt wird. Ob es verständlich ist und in
der richtigen Reihenfolge kommt, beurteilt nur ein Mensch. Einmal vor dem
Start und nach grösseren Änderungen an der Oberfläche.

### Mac mit Safari

- VoiceOver ein und aus: **Cmd + F5**. «VO» heisst **Ctrl + Option**.
- Nächstes Element: VO + Pfeil rechts. Aktivieren: VO + Leertaste.
- Nächste Überschrift: VO + Cmd + H. Übersicht aller Überschriften, Links und
  Felder: VO + U (Rotor), dann Pfeil links oder rechts.
- Tab springt wie ohne VoiceOver zum nächsten Bedienelement.

### iPhone mit Safari

- VoiceOver: Einstellungen → Bedienungshilfen → VoiceOver. Bequemer über
  Bedienungshilfen-Kurzbefehl: dreimal die Seitentaste.
- Wischen nach rechts oder links: nächstes oder voriges Element. Doppeltippen:
  aktivieren. Rotor: zwei Finger drehen, dann nach oben oder unten wischen.

### Prüfpunkte

Je Punkt: tun, hinhören, abhaken. Stimmt etwas nicht, notieren: Seite, was du
getan hast, was VoiceOver sagte, was du erwartet hättest.

1. **Startseite.** Die Hauptüberschrift ist über den Rotor zu finden. Die
   Sprachknöpfe sagen ihre Sprache («Deutsch», «Français» …) und welche gewählt
   ist. Die Vorführung redet nicht ununterbrochen dazwischen; «Anhalten» ist
   erreichbar.
2. **Rundgang in der Demo** (beim ersten Besuch, sonst Knopf «Rundgang»). Der
   Dialog nennt seinen Namen, der Text des Schritts wird gelesen. Weiter mit
   Enter oder Doppeltippen; jeder Schritt wird angesagt. Escape beendet ihn
   (Mac).
3. **Frage stellen** über eine der Einstiegsfragen. Die Arbeitsschritte
   werden angesagt, am Ende «Antwort da: …» mit Urteil und Zahl der Quellen.
4. **Antwort lesen.** Im Rotor unter Überschriften: das Urteil als Wort. Die
   Aussage, darunter das Zitat. Auf Englisch umstellen und dieselbe Frage
   stellen: Das deutsche Zitat liest VoiceOver mit deutscher Stimme.
5. **Beleg öffnen** (Blatt unter der Antwort aktivieren). Der Dialog nennt
   Dokument und Seite, die markierte Stelle wird gelesen. «Schliessen» bringt
   den Fokus zurück aufs Blatt.
6. **Anmeldung.** Mit falschem Passwort: Die Fehlermeldung wird vorgelesen,
   ohne dass man sie suchen muss.
7. **Dokumente** (angemeldet). «Dokument hinzufügen» ist ein Knopf mit Namen;
   der Stand einer Datei («wird eingelesen», «bereit») ist lesbar. Ein Projekt
   anlegen: Feld und Knopf sind beschriftet, eine Fehlermeldung wird angesagt.
8. **Sprache wechseln.** Nach dem Wechsel liest VoiceOver die Seite in der
   neuen Sprache vor.

Nicht Teil dieser Liste: NVDA unter Windows. Die Barrierefreiheitserklärung
nennt das als Grenze.
