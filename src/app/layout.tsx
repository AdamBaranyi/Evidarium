import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Fuss } from './_teile/fuss';
import { env } from '@/lib/config/env';
import './globals.css';

const BESCHREIBUNG = 'Antworten aus deinen Dokumenten – mit Quellen, die du nachlesen kannst.';

/*
 * Angaben für geteilte Links. Ohne sie zeigte ein Link auf LinkedIn oder in
 * einer Nachricht nichts als die nackte Adresse — für ein Portfolio-Projekt,
 * das gerade dort geteilt wird, ein schlechter erster Eindruck. Befund S8.
 * Das Bild liegt als `opengraph-image.png` daneben und wird von Next selbst
 * verdrahtet.
 */
export const metadata: Metadata = {
  metadataBase: new URL(env.APP_ORIGIN),
  title: 'Evidarium',
  description: BESCHREIBUNG,
  openGraph: {
    title: 'Evidarium',
    description: BESCHREIBUNG,
    locale: 'de_CH',
    type: 'website',
    siteName: 'Evidarium',
  },
  twitter: { card: 'summary_large_image' },
};

/*
 * `async` und `headers()`: Das macht jede Seite dynamisch, und das ist die
 * Voraussetzung für die Nonce der Content Security Policy. Eine statisch
 * vorgerenderte Seite hätte zur Bauzeit keine Nonce — ihre Skripte würden
 * von der eigenen Richtlinie blockiert.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await headers();
  return (
    <html lang="de-CH">
      {/* Browser-Erweiterungen setzen Attribute am body, bevor React lädt. */}
      <body suppressHydrationWarning>
        {/*
         * Die Sprungmarke ist das Erste auf jeder Seite: Wer mit der Tastatur
         * kommt, soll Kopfzeile und Navigation nicht jedes Mal durchlaufen
         * müssen. Unsichtbar, bis sie den Fokus hat. Befund S3.
         */}
        <a href="#inhalt" className="sprungmarke">
          Zum Inhalt springen
        </a>
        <div className="wurzel flex min-h-dvh flex-col">
          <div className="wurzel-inhalt flex flex-1 flex-col">{children}</div>
          <Fuss />
        </div>
      </body>
    </html>
  );
}
