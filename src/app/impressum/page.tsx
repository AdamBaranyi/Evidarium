import type { Metadata } from 'next';
import { Betreiber, Textseite } from '../_teile/textseite';
import { env } from '@/lib/config/env';

export const metadata: Metadata = { title: 'Impressum – Evidarium' };

// Die Angaben kommen zur Laufzeit vom Server, nie aus dem Repository.
export const dynamic = 'force-dynamic';

export default function ImpressumPage() {
  return (
    <Textseite titel="Impressum" stand="21. September 2026">
      <h2>Verantwortlich</h2>
      <Betreiber
        name={env.BETREIBER_NAME}
        adresse={env.BETREIBER_ADRESSE}
        email={env.BETREIBER_EMAIL}
      />

      <h2>Worum es sich handelt</h2>
      <p>
        Evidarium ist ein Portfolio-Projekt: ein Wissensassistent, der Fragen aus hochgeladenen
        Dokumenten beantwortet und jede Aussage mit einem wörtlichen Zitat belegt. Es ist kein
        kommerzielles Angebot. Die Dokumente der Vorführung stammen von einer erfundenen Firma.
      </p>

      <h2>Quelltext</h2>
      <p>
        Der vollständige Quelltext ist öffentlich:{' '}
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
