import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Fuss } from './_teile/fuss';
import { GEMEINSAM } from './_teile/texte';
import { env } from '@/lib/config/env';
import { SprachAnbieter } from '@/lib/i18n/client';
import { sprache } from '@/lib/i18n/server';
import { sprachTag, type Sprache } from '@/lib/i18n/sprachen';
import './globals.css';

const OG_LOCALE: Record<Sprache, string> = { de: 'de_CH', fr: 'fr_CH', it: 'it_CH', en: 'en_GB' };

/*
 * Angaben für geteilte Links. Ohne sie zeigte ein Link auf LinkedIn oder in
 * einer Nachricht nichts als die nackte Adresse — für ein Portfolio-Projekt,
 * das gerade dort geteilt wird, ein schlechter erster Eindruck. Befund S8.
 * Das Bild liegt als `opengraph-image.png` daneben und wird von Next selbst
 * verdrahtet.
 */
export async function generateMetadata(): Promise<Metadata> {
  const s = await sprache();
  const beschreibung = GEMEINSAM[s].beschreibung;
  return {
    metadataBase: new URL(env.APP_ORIGIN),
    title: 'Evidarium',
    description: beschreibung,
    openGraph: {
      title: 'Evidarium',
      description: beschreibung,
      locale: OG_LOCALE[s],
      type: 'website',
      siteName: 'Evidarium',
    },
    twitter: { card: 'summary_large_image' },
  };
}

/*
 * `async` und `headers()`: Das macht jede Seite dynamisch, und das ist die
 * Voraussetzung für die Nonce der Content Security Policy. Eine statisch
 * vorgerenderte Seite hätte zur Bauzeit keine Nonce — ihre Skripte würden
 * von der eigenen Richtlinie blockiert.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await headers();
  const s = await sprache();
  return (
    <html lang={sprachTag(s)}>
      {/* Browser-Erweiterungen setzen Attribute am body, bevor React lädt. */}
      <body suppressHydrationWarning>
        {/*
         * Die Sprungmarke ist das Erste auf jeder Seite: Wer mit der Tastatur
         * kommt, soll Kopfzeile und Navigation nicht jedes Mal durchlaufen
         * müssen. Unsichtbar, bis sie den Fokus hat. Befund S3.
         */}
        <a href="#inhalt" className="sprungmarke">
          {GEMEINSAM[s].sprungmarke}
        </a>
        <SprachAnbieter sprache={s}>
          <div className="wurzel flex min-h-dvh flex-col">
            <div className="wurzel-inhalt flex flex-1 flex-col">{children}</div>
            <Fuss />
          </div>
        </SprachAnbieter>
      </body>
    </html>
  );
}
