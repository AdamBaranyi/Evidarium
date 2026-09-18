'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import type { BesucherDokument } from '@/lib/demo/besucher-dokumente';
import { DEMO_GRENZEN } from '@/lib/demo/grenzen';
import { fehlerText, statusText } from '@/lib/documents/zustaende';

/*
 * Eigene Dateien in der Demo.
 *
 * **Der Hinweis auf die Löschung steht über dem Formular, nicht darunter und
 * nicht klein.** Wer etwas hochlädt, soll vorher wissen, dass es wieder
 * verschwindet — und dass er nichts Vertrauliches hochladen soll. Ein
 * Hinweis, den man erst nach dem Hochladen liest, ist keiner.
 */
export function EigeneDateien({ dokumente }: { dokumente: BesucherDokument[] }) {
  const router = useRouter();
  const eingabe = useRef<HTMLInputElement>(null);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  const voll = dokumente.length >= DEMO_GRENZEN.maxDateien;

  async function senden(formular: FormData) {
    setFehler(null);
    setLaeuft(true);
    try {
      const antwort = await fetch('/api/demo/documents', { method: 'POST', body: formular });
      if (!antwort.ok) {
        const daten = (await antwort.json()) as { fehler?: string };
        setFehler(daten.fehler ?? 'Upload nicht möglich.');
        return;
      }
      if (eingabe.current) eingabe.current.value = '';
      router.refresh();
    } catch {
      setFehler('Die Verbindung wurde unterbrochen. Bitte noch einmal versuchen.');
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <section className="panel flex min-w-0 flex-col gap-4 p-4">
      <div className="flex flex-col gap-2">
        <h2>Eigene Datei mitbringen</h2>
        <p>
          <strong>Wird nach {DEMO_GRENZEN.stunden} Stunden automatisch gelöscht.</strong> Lade
          nichts Vertrauliches hoch — das hier ist eine öffentliche Vorführung auf fremdem Server.
        </p>
        <p className="text-tinte-leise">
          Bis zu {DEMO_GRENZEN.maxDateien} Dateien je Besuch, je höchstens{' '}
          {DEMO_GRENZEN.maxBytes / 1024 / 1024} MiB und {DEMO_GRENZEN.maxSeiten} Seiten. PDF mit
          Textschicht, TXT oder Markdown.
        </p>
      </div>

      {dokumente.length > 0 && (
        <ul className="flex flex-col gap-2 border-t border-kante pt-3">
          {dokumente.map((dokument) => {
            const problem = fehlerText(dokument.errorCode);
            return (
              <li key={dokument.id}>
                <p>{dokument.filename}</p>
                <p className="text-tinte-leise">{problem ?? statusText(dokument.status)}</p>
              </li>
            );
          })}
        </ul>
      )}

      {voll ? (
        <p className="text-tinte-leise">
          Mehr als {DEMO_GRENZEN.maxDateien} Dateien gehen in der Demo nicht. Die vorhandenen
          verschwinden von selbst.
        </p>
      ) : (
        <form action={senden} className="flex flex-col gap-3 border-t border-kante pt-3">
          <label className="flex flex-col gap-2">
            <span className="text-tinte-leise">Datei auswählen</span>
            <input
              ref={eingabe}
              type="file"
              name="datei"
              required
              accept=".pdf,.txt,.md,.markdown"
              /*
               * `max-w-full`, sonst zieht das Dateifeld die Seite bei 320 px
               * breiter als den Bildschirm: Es bringt eine eigene Mindestbreite
               * aus Knopf und Dateiname mit.
               */
              className="w-full min-w-0 text-base"
            />
          </label>

          {fehler !== null && (
            <p role="alert" className="text-tinte">
              {fehler}
            </p>
          )}

          <button
            type="submit"
            disabled={laeuft}
            className="min-h-11 self-start bg-aktion-grund px-5 py-2 text-aktion-tinte disabled:opacity-55"
          >
            {laeuft ? 'Wird übertragen …' : 'Hochladen'}
          </button>
        </form>
      )}
    </section>
  );
}
