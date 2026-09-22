import Link from 'next/link';
import { demoBereit } from '@/lib/demo/korpus';
import { Vorfuehrung } from './start/vorfuehrung';
import { sprache } from '@/lib/i18n/server';
import { Kopf } from './_teile/kopf';
import { Licht } from './_teile/licht';
import { START } from './start/texte';

// Ob die Demo bereitsteht, entscheidet sich am Korpus in der Datenbank.
export const dynamic = 'force-dynamic';

/*
 * Die Startseite zeigt **das Produkt bei der Arbeit**, nicht eine Behauptung
 * darüber. Rechts läuft eine Frage durch: einbetten, suchen, antworten,
 * Belege prüfen — bis die Antwort mit ihrem Blatt dasteht.
 *
 * Das Beispiel stammt aus dem erfundenen Korpus und sagt das auch. Ein
 * Produkt, das Nachprüfbarkeit verspricht, darf auf seiner eigenen Startseite
 * nichts vorführen, was es nicht belegen kann.
 */
export default async function StartPage() {
  const demo = await demoBereit();
  const t = START[await sprache()];

  return (
    <div className="flex flex-1 flex-col overflow-x-clip">
      <Licht bewegt />
      <Kopf>
        <Link href="/login" className="ms-auto underline underline-offset-4">
          {t.anmelden}
        </Link>
      </Kopf>

      <main id="inhalt" className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-14">
        <div className="flex max-w-[52rem] flex-col gap-7">
          <h1 className="max-w-[20ch] text-2xl leading-[var(--line-title)]">{t.titel}</h1>

          <p className="max-w-[var(--mass)] text-lg text-tinte-leise">{t.text}</p>

          <nav
            aria-label={t.einstieg}
            className="flex flex-wrap items-center gap-x-4 gap-y-3 text-lg"
          >
            {demo && (
              <Link href="/demo" className="min-h-11 bg-aktion-grund px-5 py-2.5 text-aktion-tinte">
                {t.demo}
              </Link>
            )}
            <Link href="/login" className="min-h-11 px-3 py-2.5 underline underline-offset-4">
              {t.anmelden}
            </Link>
          </nav>
        </div>

        <section aria-label={t.bereich} className="flex flex-col gap-4">
          <Vorfuehrung />
          <p className="pt-2 text-tinte-leise md:pt-12">{t.herkunft}</p>
        </section>
      </main>
    </div>
  );
}
