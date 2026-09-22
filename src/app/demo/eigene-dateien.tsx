import type { BesucherDokument } from '@/lib/demo/besucher-dokumente';
import { DEMO_GRENZEN } from '@/lib/demo/grenzen';
import { fehlerText, inArbeit, statusText } from '@/lib/documents/zustaende';
import { sprache } from '@/lib/i18n/server';
import { DateiKnopf } from '../_teile/datei-knopf';
import { Nachladen } from '../_teile/nachladen';
import { DEMO } from './texte';

/*
 * Eigene Dateien in der Demo.
 *
 * **Der Hinweis auf die Löschung steht über dem Knopf, nicht darunter und
 * nicht klein.** Wer etwas hochlädt, soll vorher wissen, dass es wieder
 * verschwindet — und dass er nichts Vertrauliches hochladen soll. Ein
 * Hinweis, den man erst nach dem Hochladen liest, ist keiner.
 */
export async function EigeneDateien({ dokumente }: { dokumente: BesucherDokument[] }) {
  const s = await sprache();
  const t = DEMO[s].eigene;
  const voll = dokumente.length >= DEMO_GRENZEN.maxDateien;

  return (
    <section className="flex min-w-0 flex-col gap-3 border-t border-kante pt-5">
      <Nachladen aktiv={dokumente.some((d) => inArbeit(d.status))} />
      <h2>{t.titel}</h2>
      <p>
        <strong>{t.geloescht(DEMO_GRENZEN.stunden)}</strong> {t.vertraulich}
      </p>

      {dokumente.length > 0 && (
        <ul className="flex flex-col gap-2">
          {dokumente.map((dokument) => (
            <li key={dokument.id} className="min-w-0">
              <p>{dokument.filename}</p>
              <p className="text-tinte-leise">
                {fehlerText(dokument.errorCode, s) ?? statusText(dokument.status, s)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {voll ? (
        <p className="text-tinte-leise">{t.voll(DEMO_GRENZEN.maxDateien)}</p>
      ) : (
        <DateiKnopf id="demo-datei" endpunkt="/api/demo/documents" beschriftung={t.knopf} />
      )}

      <p className="text-tinte-leise">
        {t.grenzen(
          DEMO_GRENZEN.maxDateien,
          DEMO_GRENZEN.maxBytes / 1024 / 1024,
          DEMO_GRENZEN.maxSeiten,
        )}
      </p>
    </section>
  );
}
