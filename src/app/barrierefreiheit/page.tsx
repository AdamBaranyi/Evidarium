import type { Metadata } from 'next';
import { Textseite } from '../_teile/textseite';
import { env } from '@/lib/config/env';
import { sprache } from '@/lib/i18n/server';
import { BARRIEREFREIHEIT } from './texte';

export async function generateMetadata(): Promise<Metadata> {
  return { title: BARRIEREFREIHEIT[await sprache()].metaTitel };
}

export const dynamic = 'force-dynamic';

/*
 * Barrierefreiheitserklärung — wie bei Tallyroom. Die Texte, in vier
 * Sprachen, stehen in `texte.ts`.
 */
export default async function BarrierefreiheitPage() {
  const t = BARRIEREFREIHEIT[await sprache()];
  return (
    <Textseite titel={t.titel} stand={t.stand}>
      <p>{t.einleitung}</p>

      <h2>{t.geprueft}</h2>
      <ul>
        {t.pruefungen.map((punkt) => (
          <li key={punkt}>{punkt}</li>
        ))}
      </ul>

      <h2>{t.gebaut}</h2>
      <ul>
        {t.bauweisen.map((punkt) => (
          <li key={punkt}>{punkt}</li>
        ))}
      </ul>

      <h2>{t.grenzen}</h2>
      <ul>
        {t.grenzenListe.map((punkt) => (
          <li key={punkt}>{punkt}</li>
        ))}
      </ul>

      <h2>{t.kontakt}</h2>
      <p>
        {env.BETREIBER_EMAIL ? (
          <>
            {t.schreib}{' '}
            <a href={`mailto:${env.BETREIBER_EMAIL}`} className="underline underline-offset-4">
              {env.BETREIBER_EMAIL}
            </a>
            . {t.wieFehler}
          </>
        ) : (
          t.keineAdresse
        )}
      </p>
    </Textseite>
  );
}
