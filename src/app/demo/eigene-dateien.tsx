import type { BesucherDokument } from '@/lib/demo/besucher-dokumente';
import { DEMO_GRENZEN } from '@/lib/demo/grenzen';
import { fehlerText, inArbeit, statusText } from '@/lib/documents/zustaende';
import { DateiKnopf } from '../_teile/datei-knopf';
import { Nachladen } from '../_teile/nachladen';

/*
 * Eigene Dateien in der Demo.
 *
 * **Der Hinweis auf die Löschung steht über dem Knopf, nicht darunter und
 * nicht klein.** Wer etwas hochlädt, soll vorher wissen, dass es wieder
 * verschwindet — und dass er nichts Vertrauliches hochladen soll. Ein
 * Hinweis, den man erst nach dem Hochladen liest, ist keiner.
 */
export function EigeneDateien({ dokumente }: { dokumente: BesucherDokument[] }) {
  const voll = dokumente.length >= DEMO_GRENZEN.maxDateien;

  return (
    <section className="flex min-w-0 flex-col gap-3 border-t border-kante pt-5">
      <Nachladen aktiv={dokumente.some((d) => inArbeit(d.status))} />
      <h2>Eigene Dateien</h2>
      <p>
        <strong>Wird nach {DEMO_GRENZEN.stunden} Stunden automatisch gelöscht.</strong> Lade nichts
        Vertrauliches hoch — das hier ist eine öffentliche Vorführung auf fremdem Server.
      </p>

      {dokumente.length > 0 && (
        <ul className="flex flex-col gap-2">
          {dokumente.map((dokument) => (
            <li key={dokument.id} className="min-w-0">
              <p>{dokument.filename}</p>
              <p className="text-tinte-leise">
                {fehlerText(dokument.errorCode) ?? statusText(dokument.status)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {voll ? (
        <p className="text-tinte-leise">
          Mehr als {DEMO_GRENZEN.maxDateien} Dateien gehen in der Demo nicht. Die vorhandenen
          verschwinden von selbst.
        </p>
      ) : (
        <DateiKnopf
          id="demo-datei"
          endpunkt="/api/demo/documents"
          beschriftung="Datei hinzufügen"
        />
      )}

      <p className="text-tinte-leise">
        Bis zu {DEMO_GRENZEN.maxDateien} Dateien je Besuch, je höchstens{' '}
        {DEMO_GRENZEN.maxBytes / 1024 / 1024} MiB und {DEMO_GRENZEN.maxSeiten} Seiten. PDF mit
        Textschicht, TXT oder Markdown.
      </p>
    </section>
  );
}
