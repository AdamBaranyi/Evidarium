import type { Metadata } from 'next';
import { Betreiber, Textseite } from '../_teile/textseite';
import { env } from '@/lib/config/env';
import { sprache } from '@/lib/i18n/server';
import { IMPRESSUM } from './texte';

export async function generateMetadata(): Promise<Metadata> {
  return { title: IMPRESSUM[await sprache()].metaTitel };
}

// Die Angaben kommen zur Laufzeit vom Server, nie aus dem Repository.
export const dynamic = 'force-dynamic';

export default async function ImpressumPage() {
  const t = IMPRESSUM[await sprache()];
  return (
    <Textseite titel={t.titel} stand={t.stand}>
      <h2>{t.verantwortlich}</h2>
      <Betreiber
        name={env.BETREIBER_NAME}
        adresse={env.BETREIBER_ADRESSE}
        email={env.BETREIBER_EMAIL}
      />

      <h2>{t.worum}</h2>
      <p>{t.worumText}</p>

      <h2>{t.quelltext}</h2>
      <p>
        {t.quelltextText}{' '}
        <a
          href="https://github.com/AdamBaranyi/Evidarium"
          className="underline underline-offset-4"
          rel="noopener"
        >
          github.com/AdamBaranyi/Evidarium
        </a>
        .
      </p>
    </Textseite>
  );
}
