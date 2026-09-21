import type { Metadata } from 'next';
import { Textseite } from '../_teile/textseite';
import { env } from '@/lib/config/env';

export const metadata: Metadata = { title: 'Barrierefreiheit – Evidarium' };
export const dynamic = 'force-dynamic';

/*
 * Barrierefreiheitserklärung — wie bei Tallyroom.
 *
 * Sie behauptet nur, was geprüft ist, und sagt, wie. «Barrierefrei» ohne
 * Prüfweg wäre eine Behauptung, die niemand einlösen kann.
 */
export default function BarrierefreiheitPage() {
  return (
    <Textseite titel="Barrierefreiheit" stand="21. September 2026">
      <p>
        Evidarium soll für alle bedienbar sein, auch mit Tastatur, Screenreader, Vergrösserung oder
        ohne Farbsehen. Ziel sind die Richtlinien WCAG 2.2 auf Stufe AA.
      </p>

      <h2>Wie das geprüft wird</h2>
      <ul>
        <li>Automatisch mit axe gegen WCAG 2.2 AA, in heller und dunkler Darstellung getrennt.</li>
        <li>Bei jeder Änderung auf drei Breiten: 320, 768 und 1440 Pixel.</li>
        <li>Keine Schrift unter 16 Pixel, in Quelltext und Browser geprüft.</li>
        <li>Kontraste von Text und Bedienelementen gerechnet, nicht geschätzt.</li>
        <li>Bedienung mit der Tastatur, sichtbarer Fokus, Sprungmarke zum Inhalt.</li>
      </ul>

      <h2>Was bewusst so gebaut ist</h2>
      <ul>
        <li>
          Farbe trägt nie allein eine Aussage: Neben jeder Urteilsfarbe steht das Urteil als Wort.
        </li>
        <li>
          Die bewegte Vorführung auf der Startseite lässt sich anhalten und steht still, wenn das
          Betriebssystem weniger Bewegung wünscht.
        </li>
        <li>Fertige Antworten und die einzelnen Arbeitsschritte werden Screenreadern angesagt.</li>
      </ul>

      <h2>Bekannte Grenzen</h2>
      <ul>
        <li>
          Mit einem echten Screenreader ist Evidarium noch nicht durchgespielt worden. Die Ansagen
          sind technisch vorhanden, aber nicht im Gebrauch erprobt.
        </li>
        <li>
          Wie gut ein hochgeladenes PDF gelesen werden kann, hängt von der Datei ab: Gescannte
          Seiten ohne Textschicht lehnt Evidarium ab und sagt das.
        </li>
      </ul>

      <h2>Etwas funktioniert nicht?</h2>
      <p>
        {env.BETREIBER_EMAIL ? (
          <>
            Schreib an{' '}
            <a href={`mailto:${env.BETREIBER_EMAIL}`} className="underline underline-offset-4">
              {env.BETREIBER_EMAIL}
            </a>
            . Hinweise auf Barrieren werden wie Fehler behandelt.
          </>
        ) : (
          'Die Kontaktadresse ist auf diesem Server nicht gesetzt.'
        )}
      </p>
    </Textseite>
  );
}
