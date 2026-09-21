import type { Metadata } from 'next';
import { Betreiber, Textseite } from '../_teile/textseite';
import { env } from '@/lib/config/env';
import { DEMO_GRENZEN } from '@/lib/demo/grenzen';

export const metadata: Metadata = { title: 'Datenschutz – Evidarium' };
export const dynamic = 'force-dynamic';

/*
 * Datenschutzerklärung nach Art. 19 DSG: wer, was, wozu, an wen, wie lange.
 *
 * **Sie beschreibt, was der Code tatsächlich tut** — jede Zahl hier steht
 * auch im Code. Ändert sich eine Frist dort, muss sie sich hier ändern;
 * darum kommen die Werte, wo es geht, aus denselben Konstanten.
 *
 * Der Abschnitt über Anthropic erscheint nur im Live-Modus. Im Demo-Modus
 * geht nichts an eine Schnittstelle, und eine Erklärung, die eine
 * Übermittlung beschreibt, die gar nicht stattfindet, wäre falsch.
 */
export default function DatenschutzPage() {
  const live = env.AI_MODE === 'live';

  return (
    <Textseite titel="Datenschutz" stand="21. September 2026">
      <p>
        Diese Seite sagt, welche Daten Evidarium bearbeitet, wozu, an wen sie gehen und wann sie
        gelöscht werden. Es gilt das Schweizer Datenschutzgesetz.
      </p>

      <h2>Verantwortlich</h2>
      <Betreiber
        name={env.BETREIBER_NAME}
        adresse={env.BETREIBER_ADRESSE}
        email={env.BETREIBER_EMAIL}
      />

      <h2>Was nicht passiert</h2>
      <ul>
        <li>Keine Werbung, keine Analysewerkzeuge, kein Tracking.</li>
        <li>
          Keine Anfragen an fremde Server beim Aufruf der Seite; auch die Schriften liegen hier.
        </li>
        <li>Kein Verkauf und keine Weitergabe zu anderen Zwecken.</li>
      </ul>

      <h2>Hosting und Serverprotokolle</h2>
      <p>
        Evidarium läuft auf einem eigenen Server bei FSIT (fsit.ch) in der Schweiz. FSIT stellt die
        Maschine bereit und bearbeitet die Daten in meinem Auftrag.
      </p>
      <p>
        Bei jedem Aufruf speichert der Server technische Daten: IP-Adresse, Datum und Uhrzeit,
        aufgerufene Adresse, Statuscode, übertragene Datenmenge und Browserkennung. Das ist nötig,
        um die Seite auszuliefern, Fehler zu finden und Angriffe abzuwehren. Die Daten werden nicht
        mit anderen zusammengeführt und nach 14 Tagen gelöscht.
      </p>

      <h2>Öffentliche Demo</h2>
      <ul>
        <li>
          <strong>Cookie</strong> «evidarium_demo», 30 Tage: zählt die Fragen je Besuch. Gespeichert
          wird nur ein Hashwert davon, nicht der Wert selbst. Das Cookie ist für die Begrenzung
          technisch nötig; darum gibt es keinen Einwilligungsdialog.
        </li>
        <li>
          <strong>IP-Adresse</strong>, nur als Hashwert, für die Grenze je Herkunft und Tag. Der
          Hashwert wird nach 24 Stunden entfernt.
        </li>
        <li>
          <strong>Eigene Dateien</strong>: Datei, gelesener Text und Suchvektoren liegen auf dem
          Server und werden nach {DEMO_GRENZEN.stunden} Stunden automatisch gelöscht. Andere
          Besucher sehen sie nicht. Lade keine vertraulichen oder persönlichen Unterlagen hoch.
        </li>
      </ul>

      <h2>Konten</h2>
      <p>
        Konten legt der Betreiber von Hand an. Gespeichert werden die E-Mail-Adresse und ein
        Passwort-Hash (Argon2id), nie das Passwort. Eine Anmeldung hält sieben Tage über ein
        technisch nötiges Cookie. Fehlgeschlagene Anmeldungen werden je Herkunft gezählt, nur als
        Hashwert.
      </p>

      {live && (
        <>
          <h2>Antworten über eine Schnittstelle</h2>
          <p>
            Dateien werden auf dem Server eingelesen und durchsucht; ganze Dateien verlassen ihn
            nie. Für eine Antwort gehen die Frage und die gefundenen Abschnitte, höchstens acht, an
            Anthropic PBC, San Francisco, USA. Anthropic bearbeitet sie als Auftragsbearbeiterin
            nur, um die Antwort zu erzeugen. Das ist eine Bekanntgabe ins Ausland.
          </p>
        </>
      )}

      <h2>Kontakt per E-Mail</h2>
      <p>
        Die Kontaktadresse leitet an mein Postfach bei Apple iCloud weiter. Apple bearbeitet Daten
        in Irland und den USA, für die USA gestützt auf Standarddatenschutzklauseln. Ich bewahre
        Nachrichten so lange auf, wie es für die Anfrage nötig ist.
      </p>

      <h2>Deine Rechte</h2>
      <p>
        Du kannst Auskunft über deine Personendaten verlangen, unrichtige Daten berichtigen und
        Daten löschen lassen, soweit keine Pflicht zur Aufbewahrung besteht. Schreib dafür an die
        oben genannte Adresse.
      </p>
    </Textseite>
  );
}
